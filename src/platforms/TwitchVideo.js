import fsp from "@absolunet/fsp"
import findByExtension from "find-by-extension"
import fs from "fs/promises"
import globby from "globby"
import path from "path"
import tempy from "tempy"
import {ApiClient} from "twitch"
import {ClientCredentialsAuthProvider} from "twitch-auth"

import AutosubCommand from "lib/AutosubCommand"
import config from "lib/config"
import FfmpegCommand from "lib/FfmpegCommand"
import {getEncodeSpeedString} from "lib/getEncodeSpeed"
import logger from "lib/logger"
import Probe from "lib/Probe"
import YouTubeDlCommand from "lib/YouTubeDlCommand"

import FfmpegAac from "src/packages/ffmpeg-args/src/FfmpegAac"
import FfmpegAudioCopy from "src/packages/ffmpeg-args/src/FfmpegAudioCopy"
import FfmpegHevc from "src/packages/ffmpeg-args/src/FfmpegHevc"

import Platform from "."

/**
 * @typedef {object} VideoData
 * @prop {number} duration Milliseconds
 * @prop {string} title
 * @prop {string} language
 * @prop {Date} creationDate
 * @prop {Date} publishDate
 * @prop {string} thumbnailUrl
 * @prop {string} type
 * @prop {string} url
 * @prop {number} views
 * @prop {string} description
 * @prop {string} ownerId
 * @prop {string} ownerTitle
 * @prop {string} id
 */

/**
 * @typedef {object} ArchiveResult
 * @prop {number} runtime
 * @prop {string} file
 */

/**
 * @param {string} folder
 * @return {Promise<string|null>}
 */
async function getDownloadedVideo(folder) {
  const files = await globby(["download.*", "!*.json"], {
    cwd: folder,
    absolute: true,
  })
  if (files.length) {
    return files[0]
  }
  return null
}

/**
 * @param {string} folder
 * @return {Promise<string|null>}
 */
async function getSrtFile(folder) {
  const files = await globby(["autosub.*.srt"], {
    cwd: folder,
    absolute: true,
  })
  if (files.length) {
    return files[0]
  }
  return null
}

export default class extends Platform {

  /**
   * @type {string}
   */
  downloadedFile = null

  /**
   * @type {string}
   */
  folder = null

  /**
   * @type {object}
   */
  meta = {}

  /**
   * @type {import("twitch").HelixVideo}
   */
  helixVideo = null

  /**
   * @type {VideoData}
   */
  videoData = null

  /**
   * @type {Probe}
   */
  probe = null

  async download() {
    const youtubeDl = new YouTubeDlCommand({
      url: this.videoData.url,
      executablePath: this.argv.youtubeDlPath,
      outputFile: path.join(this.folder, "download.%(ext)s"),
      writeInfoJson: true,
      callHome: false,
    })
    await youtubeDl.run()
    this.downloadedFile = await getDownloadedVideo(this.folder)
  }

  async createSubtitles() {
    const tempFolder = tempy.directory({
      prefix: "autosub-",
    })
    logger.debug(`Using temp folder: ${tempFolder}`)
    const autosub = new AutosubCommand({
      executablePath: this.argv.autosubPath,
      inputFile: this.downloadedFile,
      outputFile: path.join(tempFolder, "autosub"),
      format: "srt",
      speechLanguage: this.argv.autosubLanguage,
      additionalOutputFiles: "full-src",
    })
    await autosub.run()
    const tempSrtFile = await getSrtFile(tempFolder)
    const srtFile = path.join(this.folder, "autosub.srt")
    const autosubSourceFile = path.join(this.folder, "autosub.json")
    const tempAutosubSourceFile = findByExtension("json", {
      cwd: tempFolder,
      absolute: true,
    })
    await Promise.all([
      fs.copyFile(tempSrtFile, srtFile),
      // @ts-ignore
      fs.copyFile(tempAutosubSourceFile, autosubSourceFile),
    ])
  }

  /**
   * @return {Promise<ArchiveResult>}
   */
  async createArchive() {
    const ffmpegOutputFile = path.join(this.folder, "archive.mp4")
    const videoEncoder = new FfmpegHevc
    let audioEncoder
    if (this.probe.audio.codec_name === "aac" && this.probe.audio.profile === "LC") {
      audioEncoder = new FfmpegAudioCopy
    } else {
      audioEncoder = new FfmpegAac
    }
    const ffmpeg = new FfmpegCommand({
      videoEncoder,
      audioEncoder,
      executablePath: this.argv.ffmpegPath,
      inputFile: this.downloadedFile,
      outputFile: ffmpegOutputFile,
      hwAccel: "auto",
    })
    const startTime = Date.now()
    await ffmpeg.run()
    return {
      runtime: Date.now() - startTime,
      file: ffmpegOutputFile,
    }
  }

  /**
   * @return {Promise<void>}
   */
  async dumpMeta() {
    const clipDataFile = path.join(this.folder, "meta.yml")
    await fsp.outputYaml(clipDataFile, this.meta)
  }

  async run() {
    if (this.options.helixVideo) {
      this.helixVideo = this.options.helixVideo
    } else {
      const authProvider = new ClientCredentialsAuthProvider(config.twitchClientId, config.twitchClientSecret)
      // const apiClient = new ApiClient({authProvider})
    }
    this.videoData = {
      duration: this.helixVideo.durationInSeconds * 1000,
      title: this.helixVideo.title.trim(),
      language: this.helixVideo.language,
      creationDate: this.helixVideo.creationDate,
      publishDate: this.helixVideo.publishDate,
      thumbnailUrl: this.helixVideo.thumbnailUrl,
      type: this.helixVideo.type,
      url: this.helixVideo.url,
      views: this.helixVideo.views,
      description: this.helixVideo.description.trim(),
      ownerId: this.helixVideo.userId,
      ownerTitle: this.helixVideo.userDisplayName,
      id: this.helixVideo.id,
    }
    const ownerName = this.videoData.ownerTitle.toLowerCase()
    this.folder = path.join(this.argv.storageDirectory, "twitch", ownerName, "videos", this.videoData.id)
    await this.download()
    this.probe = new Probe(this.downloadedFile, this.argv.ffprobePath)
    await this.probe.run()
    const [archiveResult] = await Promise.all([
      this.createArchive(),
      this.createSubtitles(),
    ])
    const archiveProbe = new Probe(archiveResult.file, this.argv.ffprobePath)
    await archiveProbe.run()
    // @ts-ignore
    // eslint-disable-next-line no-underscore-dangle
    this.meta.helixVideo = this.helixVideo._data
    this.meta.probe = this.probe.toJson()
    this.meta.archiveProbe = archiveProbe.toJson()
    logger.info(`Encoded “${this.probe.toString()}” to “${archiveProbe.toString()}” with speed ${getEncodeSpeedString(this.probe.duration, archiveResult.runtime)}`)
    await this.dumpMeta()
  }

}