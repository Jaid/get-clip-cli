import fsp from "@absolunet/fsp"
import findByExtension from "find-by-extension"
import fs from "fs/promises"
import globby from "globby"
import makeDir from "make-dir"
import normalizePath from "normalize-path"
import prettyBytes from "pretty-bytes"
import sureArray from "sure-array"
import tempy from "tempy"

import AutosubCommand from "lib/AutosubCommand"
import FfmpegCommand from "lib/FfmpegCommand"
import findSrtFile from "lib/findSrtFile"
import logger from "lib/logger"
import {makeHevcEncoder, makeOpusEncoder} from "lib/makeEncoder"
import makeYoutubeDlCommand from "lib/makeYoutubeDlCommand"
import pathJoin from "lib/pathJoin"
import Probe from "lib/Probe"
import replaceBasename from "lib/replaceBasename"
import YouTubeDlCommand from "lib/YouTubeDlCommand"

export default class Platform {

  /**
   * @type {string}
   */
  folder = null

  /**
   * @type {string}
   */
  fileBase = null

  /**
   * @type {object}
   */
  meta = {}

  /**
   * @type {() => Promise<void>}
   */
  async beforeRun() {}

  /**
   * @type {() => Promise<void>}
   */
  async afterRun() {}

  /**
   * @param {import("src/lib/TargetUrl").default} targetUrl
   * @param {import("yargs").Arguments<import("src").Options>} argv
   * @param {object} [options]
   */
  constructor(targetUrl, argv, options = {}) {
    logger.info(`[${targetUrl.type}] Handling ${targetUrl.url}`)
    this.targetUrl = targetUrl
    this.argv = argv
    this.options = options
  }

  /**
   * @param {string|string[]} glob
   * @param {string} [folder]
   * @return {Promise<string[]>}
   */
  async findFiles(glob, folder) {
    const normalizedGlob = sureArray(glob)
    const cwd = folder ? pathJoin(this.folder, folder) : this.folder
    const files = await globby(normalizedGlob, {
      cwd,
      absolute: true,
    })
    return files
  }

  /**
   * @param {string|string[]} glob
   * @param {string} [folder]
   * @return {Promise<string|null>}
   */
  async findFile(glob, folder) {
    const result = await this.findFiles(glob, folder)
    if (!result.length) {
      return null
    }
    return result[0]
  }

  /**
   * @return {string}
   */
  getFolder() {
    throw new Error("Has to be implemented in child classes")
  }

  /**
   * @return {string}
   */
  getFileBase() {
    throw new Error("Has to be implemented in child classes")
  }

  /**
   * @param {string} extension
   * @return {string}
   */
  getFileName(extension) {
    return `${this.fileBase}.${extension}`
  }

  async start() {
    await this.beforeRun()
    this.folder = this.getFolder()
    this.fileBase = this.getFileBase()
    await makeDir(this.folder)
    await this.run()
    await this.afterRun()
    await this.dumpMeta()
  }

  /**
   * @param {...string} segments
   * @return {string}
   */
  fromFolder(...segments) {
    return pathJoin(this.folder, ...segments)
  }

  /**
   * @param {...string} segments
   * @return {string}
   */
  fromStorageDirectory(...segments) {
    return pathJoin(this.argv.storageDirectory, ...segments)
  }

  async run() {
  }

  /**
   * @return {Promise<void>}
   */
  async dumpMeta() {
    const clipDataFile = pathJoin(this.folder, "meta.yml")
    await fsp.outputYaml(clipDataFile, this.meta)
  }

  /**
   * @return {Promise<string|null>}
   */
  async getDownloadedVideoFile() {
    return this.findFile(["download.*", "!*.json"], "download")
  }

  /**
   * @typedef {object} DownloadResult
   * @prop {string} downloadFolder
   * @prop {string} downloadedFile
   * @prop {import("fs").Stats} downloadedFileStat
   * @prop {import("execa").ExecaReturnValue} youtubeDlResult
   * @prop {import("lib/Probe").default} [probe]
   */

  /**
   * @typedef {object} DownloadOptions
   * @prop {string} [folderName="download"]
   * @prop {boolean} [probe]
   * @prop {boolean} [autosub]
   */

  /**
   * @param {string} url
   * @param {DownloadOptions} [downloadOptions]
   * @return {Promise<DownloadResult>}
   */
  async download(url, downloadOptions) {
    /**
     * @type {DownloadOptions}
     */
    const options = {
      folderName: "download",
      probe: false,
      autosub: false,
      ...downloadOptions,
    }
    const downloadFolder = pathJoin(this.folder, options.folderName)
    await makeDir(downloadFolder)
    logger.debug(`Downloading ${url}`)
    /**
     * @type {import("src/lib/Command").Options & import("src/lib/YouTubeDlCommand").CommandOptions}
     */
    const youtubeDlOptions = {
      url,
      executablePath: this.argv.youtubeDlPath,
      argv: this.argv,
      outputFile: pathJoin(downloadFolder, "download.%(ext)s"),
      writeInfoJson: true,
      callHome: false,
    }
    const youtubeDl = makeYoutubeDlCommand(this.argv, youtubeDlOptions)
    const youtubeDlResult = await youtubeDl.run()
    let downloadedFile = await this.getDownloadedVideoFile()
    if (!downloadedFile) {
      throw new Error(`Something went wrong. youtube-dl did run, but there is no downloaded file in “${this.folder}”.`)
    }
    if (options.autosub) {
      await this.createSubtitles(downloadedFile)
    }
    const renamedFile = replaceBasename(downloadedFile, this.fileBase)
    if (renamedFile === downloadedFile) {
      logger.debug(`Nothing better to rename to, so we will keep the download file name “${downloadedFile}”`)
    } else {
      logger.debug(`Renaming ${downloadedFile} to ${renamedFile}`)
      await fs.rename(downloadedFile, renamedFile)
      downloadedFile = renamedFile
    }
    const downloadedFileStat = await fs.stat(downloadedFile)
    logger.info(`Downloaded ${downloadedFile} (${prettyBytes(downloadedFileStat.size)})`)
    const result = {
      downloadFolder,
      downloadedFile,
      downloadedFileStat,
      youtubeDlResult,
    }
    if (options.probe) {
      const probe = new Probe(downloadedFile, this.argv.ffprobePath)
      await probe.run()
      result.probe = probe
    }
    return result
  }

  /**
   * @typedef {object} CreateSubtitlesOptions
   * @prop {import("lib/AutosubCommand").CommandOptions} autosubOptions
   */

  /**
   * @param {string} inputFile
   * @param {CreateSubtitlesOptions} [options]
   * @return {Promise<void>}
   */
  async createSubtitles(inputFile, options) {
    const tempFolder = normalizePath(tempy.directory({
      prefix: "autosub-",
    }))
    logger.debug(`Using temp folder: ${tempFolder}`)
    const autosub = new AutosubCommand({
      inputFile,
      executablePath: this.argv.autosubPath,
      argv: this.argv,
      outputFile: pathJoin(tempFolder, "autosub"),
      format: "srt",
      speechLanguage: this.argv.autosubLanguage,
      additionalOutputFiles: "full-src",
      ...options,
    })
    const autosubFolder = this.fromFolder("autosub")
    await Promise.all([
      autosub.run(),
      makeDir(autosubFolder),
    ])
    const tempSrtFile = await findSrtFile(tempFolder)
    const srtFile = pathJoin(autosubFolder, this.getFileName("srt"))
    const autosubSourceFile = pathJoin(autosubFolder, this.getFileName("json"))
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
   * @typedef {object} RecodeOptions
   * @prop {string} inputFile
   * @prop {string} [outputName="archive"]
   * @prop {import("src/packages/ffmpeg-args/src/index").CommandOptions & import("lib/Command").Options} [ffmpegOptions]
   * @prop {string} [fileExtension="mp4"]
   * @prop {boolean} probe
   */

  /**
   * @typedef {object} RecodeResult
   * @prop {number} runtime
   * @prop {string} file
   * @prop {import("lib/Probe").default} [probe]
   */

  /**
   * @param {RecodeOptions} [options]
   * @return {Promise<RecodeResult>}
   */
  async recode(options) {
    const mergedOptions = {
      outputName: "archive",
      fileExtension: "mp4",
      ...options,
    }
    const archiveFolder = this.fromFolder(mergedOptions.outputName)
    await makeDir(archiveFolder)
    const ffmpegOutputFile = pathJoin(archiveFolder, this.getFileName(mergedOptions.fileExtension))
    const videoEncoder = makeHevcEncoder(this.argv)
    const audioEncoder = makeOpusEncoder(this.argv)
    const ffmpeg = new FfmpegCommand({
      inputFile: mergedOptions.inputFile,
      videoEncoder,
      audioEncoder,
      executablePath: this.argv.ffmpegPath,
      argv: this.argv,
      outputFile: ffmpegOutputFile,
      hwAccel: "auto",
      ...mergedOptions.ffmpegOptions,
    })
    const startTime = Date.now()
    await ffmpeg.run()
    const result = {
      runtime: Date.now() - startTime,
      file: ffmpegOutputFile,
    }
    if (options.probe) {
      const probe = new Probe(ffmpegOutputFile, this.argv.ffprobePath)
      await probe.run()
      result.probe = probe
    }
    return result
  }

}