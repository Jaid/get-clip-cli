/**
 * @typedef {object} Options
 * @prop {string} url
 */

export default class {

  /**
   * @param {Options} options
   */
  constructor(options) {
    this.options = options
  }

  /**
   * @return {string[]}
   */
  buildCommand() {
    const commandArgs = []
    commandArgs.push(this.options.url)
    return commandArgs
  }

}