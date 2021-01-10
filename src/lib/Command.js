import execa from "execa"
import {pick} from "lodash"
import readableMs from "readable-ms"
import Stoppuhr from "stoppuhr"

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
   * @return {Promise<void>}
   */
  async beforeRun() {}

  /**
   * @param {import("execa").ExecaReturnValue} result
   * @return {Promise<void>}
   */
  async afterRun(result) {}

  /**
   * @param {object} [additionalOptions]
   * @return {Promise<*>}
   */
  async run(additionalOptions) {
    await this.beforeRun()
    const commandArguments = this.buildArguments(additionalOptions)
    logger.debug(`${this.options.executablePath} ${commandArguments.join(" ")}`)
    const stoppuhr = new Stoppuhr
    const result = await execa(this.options.executablePath, commandArguments)
    logger.debug(`Returned ${result.exitCode} in ${stoppuhr.totalText()}`)
    await this.afterRun(result)
    return result
  }

}