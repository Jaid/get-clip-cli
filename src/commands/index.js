import logger from "lib/logger"
import TargetUrl from "lib/TargetUrl"

import TwitchClip from "src/platforms/TwitchClip"

const platformMap = {
  twitchClip: TwitchClip,
}

const testUrl = "https://clips.twitch.tv/SassyAgreeableRutabagaDancingBanana" // Lea Diablo (short)
// const testUrl = "https://www.twitch.tv/jaidchen/clip/FrailPreciousSalmonSaltBae" // Jaidchen Testi (mine)

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
  const platform = new platformMap[targetUrl.type](targetUrl, argv)
  await platform.run()
}