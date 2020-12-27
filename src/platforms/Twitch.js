import makeDir from "make-dir"

import FfmpegCommand from "lib/FfmpegCommand"
import {makeHevcEncoder, makeOpusEncoder} from "lib/makeEncoder"
import pathJoin from "lib/pathJoin"

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
  youtubeDlDataFile = null

  /**
   * @type {string}
   */
  videoFileBase = "video"

  /**
   * @type {import("lib/Probe").default}
   */
  probe = null

  /**
   * @return {Promise<ArchiveResult>}
   */
  async createArchive() {
    const archiveFolder = this.fromFolder("archive")
    await makeDir(archiveFolder)
    const ffmpegOutputFile = pathJoin(archiveFolder, this.getFileName("mp4"))
    const videoEncoder = makeHevcEncoder(this.argv)
    const audioEncoder = makeOpusEncoder(this.argv)
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

}