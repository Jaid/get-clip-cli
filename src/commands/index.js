import logger from "lib/logger"
import TargetUrl from "lib/TargetUrl"

import TwitchClip from "src/handler/twitchClip"

const handlerMap = {
  twitchClip: TwitchClip,
}

const testUrl = "https://clips.twitch.tv/SassyAgreeableRutabagaDancingBanana"

/**
 * @param {import("yargs").Arguments<import("src").Options>} argv
 */
export default async argv => {
  if (!argv.url) {
    argv.url = testUrl
  }
  logger.info(`Target URL: ${argv.url}`)
  const targetUrl = new TargetUrl(argv.url)
  const handler = new handlerMap[targetUrl.type](targetUrl, argv)
  await handler.run()
}