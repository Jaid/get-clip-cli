import fsp from "@absolunet/fsp"
import fs from "fs/promises"
import globby from "globby"
import makeDir from "make-dir"
import normalizePath from "normalize-path"
import prettyBytes from "pretty-bytes"

import FfmpegCommand from "lib/FfmpegCommand"
import logger from "lib/logger"
import pathJoin from "lib/pathJoin"
import replaceBasename from "lib/replaceBasename"
import YouTubeDlCommand from "lib/YouTubeDlCommand"

import FfmpegAac from "src/packages/ffmpeg-args/src/FfmpegAac"
import FfmpegAudioCopy from "src/packages/ffmpeg-args/src/FfmpegAudioCopy"
import FfmpegHevc from "src/packages/ffmpeg-args/src/FfmpegHevc"
import FfmpegOpus from "src/packages/ffmpeg-args/src/FfmpegOpus"

import Platform from "."

/**
 * @typedef {object} ArchiveResult
 * @prop {number} runtime
 * @prop {string} file
 */

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
   * @type {string}
   */
  youtubeDlDataFile = null

  /**
   * @type {object}
   */
  meta = {}

  /**
   * @type {string}
   */
  videoFileBase = "video"

  /**
   * @type {import("lib/Probe").default}
   */
  probe = null

  /**
   * @return {Promise<string|null>}
   */
  async getDownloadedVideo() {
    const files = await globby(["download.*", "!*.json"], {
      cwd: pathJoin(this.folder, "download"),
      absolute: true,
    })
    if (files.length) {
      return normalizePath(files[0])
    }
    return null
  }

  /**
   * @param {string} url
   * @return {Promise<void>}
   */
  async download(url) {
    const downloadFolder = pathJoin(this.folder, "download")
    await makeDir(downloadFolder)
    const youtubeDl = new YouTubeDlCommand({
      url,
      executablePath: this.argv.youtubeDlPath,
      argv: this.argv,
      outputFile: pathJoin(downloadFolder, "download.%(ext)s"),
      writeInfoJson: true,
      callHome: false,
    })
    await youtubeDl.run()
    this.downloadedFile = await this.getDownloadedVideo()
    if (!this.downloadedFile) {
      throw new Error(`Something went wrong. youtube-dl did run, but there is no downloaded file in “${this.folder}”.`)
    }
    const renamedFile = replaceBasename(this.downloadedFile, this.videoFileBase)
    if (renamedFile === this.downloadedFile) {
      logger.debug(`Nothing better to rename to, so we will keep the download file name “${this.downloadedFile}”`)
    } else {
      logger.debug(`Renaming ${this.downloadedFile} to ${renamedFile}`)
      await fs.rename(this.downloadedFile, renamedFile)
      this.downloadedFile = renamedFile
    }
    const downloadedFileStat = await fs.stat(this.downloadedFile)
    logger.info(`Downloaded ${this.downloadedFile} (${prettyBytes(downloadedFileStat.size)})`)
  }

  /**
   * @return {Promise<ArchiveResult>}
   */
  async createArchive() {
    const archiveFolder = pathJoin(this.folder, "archive")
    await makeDir(archiveFolder)
    const ffmpegOutputFile = pathJoin(archiveFolder, `${this.videoFileBase}.mp4`)
    const videoEncoder = new FfmpegHevc({
      preset: this.argv.encodePreset,
    })
    const audioEncoder = new FfmpegOpus
    // if (this.probe && this.probe.audio.codec_name === "aac" && this.probe.audio.profile === "LC") {
    //   logger.debug("Audio will not be reencoded, because it is already aac_LC.")
    //   audioEncoder = new FfmpegAudioCopy
    // } else {
    //   audioEncoder = new FfmpegAac
    // }
    const ffmpeg = new FfmpegCommand({
      videoEncoder,
      audioEncoder,
      executablePath: this.argv.ffmpegPath,
      argv: this.argv,
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
    const clipDataFile = pathJoin(this.folder, "meta.yml")
    await fsp.outputYaml(clipDataFile, this.meta)
  }

}