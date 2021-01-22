import fileExtension from "file-extension"
import {omit} from "lodash"
import readableMs from "readable-ms"
import Stoppuhr from "stoppuhr"

import Command from "src/lib/Command"
import FfmpegCommandGenerator from "src/packages/ffmpeg-args/src"

import {ffmpegHeaderColor, ffmpegLineColor} from "./colors"
import {getEncodeSpeedString} from "./getEncodeSpeed"
import logger from "./logger"
import pathRelative from "./pathRelative"
import Probe from "./Probe"

export default class extends Command {

  /**
   * @type {import("src/packages/ffmpeg-args/src/index").CommandOptions} options
   */
  commandOptions = null

  /**
   * @param {import("src/packages/ffmpeg-args/src/index").CommandOptions & import("lib/Command").Options} options
   */
  constructor(options) {
    super(options)
    this.commandOptions = omit(options, ["executablePath", "argv"])
  }

  /**
   * @return {Promise<void>}
   */
  async beforeRun() {
    this.stoppuhr = new Stoppuhr
    if (!this.commandOptions.inputFile) {
      throw new Error(`No input file given for ffmpeg command with output file ${this.commandOptions.outputFile}`)
    }
    this.probe = new Probe(this.commandOptions.inputFile, this.options.argv.ffprobePath)
    await this.probe.run()
    if (!this.commandOptions.outputFile) {
      throw new Error(`No output file given for ffmpeg command with input file ${this.commandOptions.outputFile}`)
    }
    if (this.commandOptions.startTime < 0) {
      logger.debug(`Set ffmpeg startTime to 0, because it was ${readableMs(this.commandOptions.startTime)}`)
      this.commandOptions.startTime = 0
    }
    let endTime = this.commandOptions.endTime
    if (!endTime && this.commandOptions.length) {
      if (this.commandOptions.startTime) {
        endTime = this.commandOptions.startTime + this.commandOptions.length
      } else {
        endTime = this.commandOptions.length
      }
    }
    if (endTime > this.probe.duration) {
      logger.warn(`endTime ${readableMs(endTime)} is higher than input duration ${readableMs(this.probe.duration)}`)
    }
    this.commandGenerator = new FfmpegCommandGenerator(this.commandOptions)
  }

  async afterRun() {
    const outputProbe = new Probe(this.commandOptions.outputFile, this.options.argv.ffprobePath)
    await outputProbe.run()
    const runTime = this.stoppuhr.total()
    logger.info(ffmpegHeaderColor(`FFmpeg success in ${readableMs(runTime)}`))
    logger.info(ffmpegLineColor(`Speed:  ${getEncodeSpeedString(outputProbe.duration, runTime)}`))
    logger.info(ffmpegLineColor(`Input:  ${pathRelative(this.options.argv.storageDirectory, this.commandOptions.inputFile)}`))
    logger.info(ffmpegLineColor(`        ${readableMs(this.probe.duration)}, ${this.probe.fileSizeText} ${fileExtension(this.commandOptions.inputFile)}, ${this.probe.toString()}`))
    logger.info(ffmpegLineColor(`Output: ${pathRelative(this.options.argv.storageDirectory, this.commandOptions.outputFile)}`))
    logger.info(ffmpegLineColor(`        ${readableMs(outputProbe.duration)}, ${outputProbe.fileSizeText} ${fileExtension(this.commandOptions.outputFile)}, ${outputProbe.toString()}`))
  }

  /**
   * @param {import("src/packages/ffmpeg-args/src/index").CommandOptions} additionalOptions?
   * @return {string[]}
   */
  buildArguments(additionalOptions) {
    return this.commandGenerator.buildArguments({
      ...this.commandOptions,
      ...additionalOptions,
    })
  }
}