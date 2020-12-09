import logger from "lib/logger"

export default class Handler {

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

}