import {omit} from "lodash"

import Command from "src/lib/Command"
import FfmpegCommandGenerator from "src/packages/ffmpeg-args/src"

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
    if (!this.commandOptions.inputFile) {
      throw new Error(`No input file given for ffmpeg command with output file ${this.commandOptions.outputFile}`)
    }
    if (!this.commandOptions.outputFile) {
      throw new Error(`No output file given for ffmpeg command with input file ${this.commandOptions.outputFile}`)
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