import fsp from "@absolunet/fsp"
import globby from "globby"
import normalizePath from "normalize-path"
import path from "path"

import FfmpegCommand from "lib/FfmpegCommand"
import pathJoin from "lib/pathJoin"
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
    const files = await globby(["!*.json"], {
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
   * @param {string} [fileBase="download"]
   * @return {Promise<void>}
   */
  async download(url, fileBase = "download") {
    const youtubeDl = new YouTubeDlCommand({
      url,
      executablePath: this.argv.youtubeDlPath,
      argv: this.argv,
      outputFile: pathJoin(this.folder, "download", `${fileBase}.%(ext)s`),
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
    const ffmpegOutputFile = pathJoin(this.folder, "archive.mp4")
    const videoEncoder = new FfmpegHevc({
      preset: this.argv.encodePreset,
    })
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