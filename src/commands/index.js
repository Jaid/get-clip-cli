import logger from "lib/logger"
import TargetUrl from "lib/TargetUrl"

import TwitchClip from "src/handler/twitchClip"

const handlerMap = {
  twitchClip: TwitchClip,
}

// const testUrl = "https://clips.twitch.tv/SassyAgreeableRutabagaDancingBanana" Lea
const testUrl = "https://www.twitch.tv/jaidchen/clip/FrailPreciousSalmonSaltBae"

/**
 * @param {import("yargs").Arguments<import("src").Options>} argv
 */
export default async argv => {
  await require("./wipe").default(argv) // Faster testing
  if (!argv.url) {
    argv.url = testUrl
  }
  logger.info(`Target URL: ${argv.url}`)
  const targetUrl = new TargetUrl(argv.url)
  const handler = new handlerMap[targetUrl.type](targetUrl, argv)
  await handler.run()
}