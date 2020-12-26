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
import findSrtFile from "lib/findSrtFile"
import logger from "lib/logger"
import pathJoin from "lib/pathJoin"
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
  constructor(targetUrl, argv, options) {
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
   * @param {string} url
   * @param {string} [folderName="download"]
   * @return {Promise<void>}
   */
  async download(url, folderName = "download") {
    const downloadFolder = pathJoin(this.folder, folderName)
    await makeDir(downloadFolder)
    logger.debug(`Downloading ${url}`)
    const youtubeDl = new YouTubeDlCommand({
      url,
      executablePath: this.argv.youtubeDlPath,
      argv: this.argv,
      outputFile: pathJoin(downloadFolder, "download.%(ext)s"),
      writeInfoJson: true,
      callHome: false,
    })
    await youtubeDl.run()
    this.downloadedFile = await this.getDownloadedVideoFile()
    if (!this.downloadedFile) {
      throw new Error(`Something went wrong. youtube-dl did run, but there is no downloaded file in “${this.folder}”.`)
    }
    const renamedFile = replaceBasename(this.downloadedFile, this.fileBase)
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
   * @typedef {object} CreateSubtitlesOptions
   * @prop {import("lib/AutosubCommand").CommandOptions} autosubOptions
   */

  /**
   * @param {CreateSubtitlesOptions} [options]
   * @return {Promise<void>}
   */
  async createSubtitles(options) {
    const inputFile = options.autosubOptions?.inputFile || this.downloadedFile
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

}