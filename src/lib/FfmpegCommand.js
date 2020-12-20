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