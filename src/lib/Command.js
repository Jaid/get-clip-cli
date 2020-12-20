import execa from "execa"
import {pick} from "lodash"
import readableMs from "readable-ms"

import logger from "./logger"

/**
 * @typedef {object} Options
 * @prop {string} executablePath
 * @prop {import("yargs").Arguments<import("src").Options>} argv
 */
export default class Command {

  /**
   * @type {Options} options
   */
  options = null

  /**
   * @param {Options} options
   */
  constructor(options) {
    this.options = pick(options, ["executablePath", "argv"])
  }

  /**
   * @param {object} [additionalOptions]
   * @return {string[]}
   */
  buildArguments(additionalOptions) {
    return []
  }

  /**
   * @param {object} [additionalOptions]
   * @return {Promise<*>}
   */
  async run(additionalOptions) {
    const commandArguments = this.buildArguments(additionalOptions)
    logger.debug(`${this.options.executablePath} ${commandArguments.join(" ")}`)
    const startTime = Date.now()
    const result = await execa(this.options.executablePath, commandArguments)
    const endTime = Date.now()
    logger.debug(`Returned ${result.exitCode} in ${readableMs(endTime - startTime)}`)
    return result
  }

}