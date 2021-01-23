import isEmpty from "is-empty"
import sureArray from "sure-array"

import {propertyColor} from "lib/colors"
import config from "lib/config"
import logger from "lib/logger"
import logProperty from "lib/logProperty"
import TargetUrl from "lib/TargetUrl"

import TwitchClip from "src/platforms/TwitchClip"
import TwitchVideo from "src/platforms/TwitchVideo"
import YoutubeVideo from "src/platforms/YoutubeVideo"

const platformMap = {
  twitchClip: TwitchClip,
  twitchVideo: TwitchVideo,
  youtubeVideo: YoutubeVideo,
}

// const testUrl = "https://www.youtube.com/watch?v=Iw-9XH6KiOk" // YouTube 6-second video
// const testUrl = "https://clips.twitch.tv/SassyAgreeableRutabagaDancingBanana" // Lea Diablo (short)
// const testUrl = "https://www.twitch.tv/videos/712407540?filter=archives&sort=time" test video
// const testUrl = "https://www.twitch.tv/jaidchen/clip/FrailPreciousSalmonSaltBae" // Jaidchen Testi (mine)

/**
 * @param {import("yargs").Arguments<import("src").Options>} argv
 */
export default async argv => {
  await require("./wipe").default(argv) // Faster testing
  const processUrl = async targetUrl => {
    const platform = new platformMap[targetUrl.type](targetUrl, argv)
    await platform.start()
  }
  if (isEmpty(argv.url)) {
    logger.info("No target URLs given")
    const fallbackTargetUrls = sureArray(config.fallbackTargetUrls)
    if (isEmpty(fallbackTargetUrls)) {
      logger.warn("No fallback target URLs set in config, quitting")
      return
    }
    logger.info("Using config.fallbackTargetUrls")
    argv.url = fallbackTargetUrls
  }
  const isSingleUrl = argv.url.length === 1
  const targetUrls = argv.url.map(url => new TargetUrl(url))
  if (isSingleUrl) {
    const targetUrl = targetUrls[0]
    logProperty("Target URL", targetUrl.name)
    await processUrl(targetUrl)
  } else {
    let i = 1
    for (const targetUrl of targetUrls) {
      logProperty(`Target URL #${i}`, targetUrl.name)
      i++
      await processUrl(targetUrl)
    }
  }
}