import {omit} from "lodash"

import Command from "src/lib/Command"
import FfmpegCommandGenerator from "src/packages/ffmpeg-args/src"

import logger from "./logger"
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
    if (!this.commandOptions.inputFile) {
      throw new Error(`No input file given for ffmpeg command with output file ${this.commandOptions.outputFile}`)
    }
    const probe = new Probe(this.commandOptions.inputFile, this.options.argv.ffprobePath)
    await probe.run()
    if (!this.commandOptions.outputFile) {
      throw new Error(`No output file given for ffmpeg command with input file ${this.commandOptions.outputFile}`)
    }
    if (this.commandOptions.startTime < 0) {
      logger.debug(`Set ffmpeg startTime to 0, because it was ${this.commandOptions.startTime} ms`)
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
    if (endTime > probe.duration) {
      logger.warn(`endTime ${endTime} ms is higher than input duration ${probe.duration} ms`)
    }
    this.commandGenerator = new FfmpegCommandGenerator(this.commandOptions)
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