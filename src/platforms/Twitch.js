import fsp from "@absolunet/fsp"
import globby from "globby"
import path from "path"

import FfmpegCommand from "lib/FfmpegCommand"
import YouTubeDlCommand from "lib/YouTubeDlCommand"

import FfmpegAac from "src/packages/ffmpeg-args/src/FfmpegAac"
import FfmpegAudioCopy from "src/packages/ffmpeg-args/src/FfmpegAudioCopy"
import FfmpegHevc from "src/packages/ffmpeg-args/src/FfmpegHevc"

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

  meta = {}

  /**
   * @type {import("lib/Probe").default}
   */
  probe = null

  /**
   * @return {Promise<string|null>}
   */
  async getDownloadedVideo() {
    const files = await globby(["download.*", "!*.json"], {
      cwd: this.folder,
      absolute: true,
    })
    if (files.length) {
      return files[0]
    }
    return null
  }

  /**
   * @param {string} url
   * @return {Promise<void>}
   */
  async download(url) {
    const youtubeDl = new YouTubeDlCommand({
      url,
      executablePath: this.argv.youtubeDlPath,
      outputFile: path.join(this.folder, "download.%(ext)s"),
      writeInfoJson: true,
      callHome: false,
    })
    await youtubeDl.run()
    this.downloadedFile = await this.getDownloadedVideo()
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

}