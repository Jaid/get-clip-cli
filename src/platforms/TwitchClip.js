import fsp from "@absolunet/fsp"
import filenamifyShrink from "filenamify-shrink"
import {outputFile} from "fs-extra"
import globby from "globby"
import path from "path"
import readFileJson from "read-file-json"
import readableMs from "readable-ms"
import {ApiClient} from "twitch"
import {ClientCredentialsAuthProvider} from "twitch-auth"

import config from "lib/config"
import FfmpegCommand from "lib/FfmpegCommand"
import {getEncodeSpeedString} from "lib/getEncodeSpeed"
import logger from "lib/logger"
import Probe from "lib/Probe"
import secondsToHms from "lib/secondsToHms"
import TargetUrl from "lib/TargetUrl"
import YouTubeDlCommand from "lib/YouTubeDlCommand"

import FfmpegAac from "src/packages/ffmpeg-args/src/FfmpegAac"
import FfmpegAudioCopy from "src/packages/ffmpeg-args/src/FfmpegAudioCopy"
import FfmpegHevc from "src/packages/ffmpeg-args/src/FfmpegHevc"
import TwitchVideo from "src/platforms/TwitchVideo"

import Platformm from "."

/**
 * @typedef {object} KrakenVod
 * @prop {string} id
 * @prop {string} url
 * @prop {number} offset
 * @prop {string} preview_image_url
 */

/**
 * @typedef {object} KrakenClip
 * @prop {string} slug
 * @prop {string} tracking_id
 * @prop {string} url
 * @prop {string} game
 * @prop {string} created_at
 * @prop {number} duration
 * @prop {KrakenVod} vod
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
 * @param {string} url
 * @return {string}
 */
function getClipIdFromThumbnailUrl(url) {
  const regex = /(7C|\|)(?<id>\d+)/
  return regex.exec(url).groups.id
}

export default class extends Platformm {

  /**
   * @type {string}
   */
  downloadedFile = null

  /**
   * @type {string}
   */
  folder = null

  /**
   * @type {string}
   */
  youtubeDlDataFile = null

  meta = {}

  /**
   * @type {boolean}
   */
  hasVideo = false

  /**
   * @type {import("twitch").HelixVideo}
   */
  helixVideo = null

  /**
   * @type {import("twitch").HelixClip}
   */
  helixClip = null

  /**
   * @type {KrakenClip}
   */
  krakenClip = null

  /**
   * @type {Probe}
   */
  probe = null

  /**
   * @return {Promise<void>}
   */
  async download() {
    const youtubeDl = new YouTubeDlCommand({
      url: this.clipData.url,
      executablePath: this.argv.youtubeDlPath,
      outputFile: path.join(this.folder, "download.%(ext)s"),
      writeInfoJson: true,
      callHome: false,
    })
    await youtubeDl.run()
    this.downloadedFile = await getDownloadedVideo(this.folder)
  }

  /**
   * @return {Promise<void>}
   */
  async prepareVideo() {
    if (!this.helixVideo) {
      throw new Error("Needs helixVideo")
    }
    const videoUrl = new TargetUrl(this.helixVideo.url)
    const videoPlatform = new TwitchVideo(videoUrl, this.argv, {
      helixVideo: this.helixVideo,
    })
    await videoPlatform.run()
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
    this.meta = {}
    const authProvider = new ClientCredentialsAuthProvider(config.twitchClientId, config.twitchClientSecret)
    const apiClient = new ApiClient({authProvider})
    const [helixClip, krakenClip] = await Promise.all([
      apiClient.helix.clips.getClipById(this.targetUrl.clipSlug),
      apiClient.callApi({
        url: `clips/${this.targetUrl.clipSlug}`,
      }),
    ])
    this.helixClip = helixClip
    this.krakenClip = krakenClip
    this.clipData = {
      id: getClipIdFromThumbnailUrl(this.helixClip.thumbnailUrl),
      slug: this.helixClip.id,
      title: this.helixClip.title.trim(),
      titleNormalized: filenamifyShrink(this.helixClip.title).trim(),
      streamerTitle: this.helixClip.broadcasterDisplayName,
      streamerId: this.helixClip.broadcasterDisplayName.toLowerCase(),
      clipperTitle: this.helixClip.creatorDisplayName,
      clipperId: this.helixClip.creatorId,
      views: this.helixClip.views,
      language: this.helixClip.language,
      thumbnailUrl: this.helixClip.thumbnailUrl,
      url: this.helixClip.url,
      creationDate: this.helixClip.creationDate,
      gameTitle: this.krakenClip.game,
      duration: this.krakenClip.duration * 1000,
    }
    logger.info(`Clip: ${this.clipData.title} (${readableMs(this.clipData.duration)})`)
    logger.info(`Clipped by ${this.clipData.clipperTitle} for ${this.clipData.streamerTitle} during ${this.clipData.gameTitle}`)
    if (this.krakenClip.vod) {
      this.hasVideo = true
      this.clipData.offset = this.krakenClip.vod.offset * 1000
      this.clipData.offsetHms = secondsToHms(this.krakenClip.vod.offset)
      this.clipData.videoId = this.helixClip.videoId
      this.helixVideo = await this.helixClip.getVideo()
      await this.prepareVideo()
    } else {
      logger.warn("Video is not available")
    }
    this.folder = path.join(this.argv.storageDirectory, "twitch", this.clipData.streamerId, "clips", this.clipData.id)
    this.youtubeDlDataFile = path.join(this.folder, "download.info.json")
    this.downloadedFile = await getDownloadedVideo(this.folder)
    if (this.downloadedFile) {
      logger.warn(`${this.downloadedFile} already exists`)
      return
    }
    await this.download()
    const youtubeDlData = await readFileJson(this.youtubeDlDataFile)
    this.probe = new Probe(this.downloadedFile, this.argv.ffprobePath)
    await this.probe.run()
    const archiveResult = await this.createArchive()
    const archiveProbe = new Probe(archiveResult.file, this.argv.ffprobePath)
    await archiveProbe.run()
    logger.info(`Encoded “${this.probe.toString()}” to “${archiveProbe.toString()}” with speed ${getEncodeSpeedString(this.probe.duration, archiveResult.runtime)}`)
    this.meta.clip = this.clipData
    this.meta.youtubeDl = youtubeDlData
    this.meta.probe = this.probe.toJson()
    this.meta.archiveProbe = archiveProbe.toJson()
    // @ts-ignore
    // eslint-disable-next-line no-underscore-dangle
    this.meta.helixClip = this.helixClip
    this.meta.krakenClip = this.krakenClip
    await this.dumpMeta()
  }

}