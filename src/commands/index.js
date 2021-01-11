import {propertyColor} from "lib/colors"
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

const testUrl = "https://www.youtube.com/watch?v=Iw-9XH6KiOk" // YouTube 6-second video
// const testUrl = "https://clips.twitch.tv/SassyAgreeableRutabagaDancingBanana" // Lea Diablo (short)
// const testUrl = "https://www.twitch.tv/videos/712407540?filter=archives&sort=time" test video
// const testUrl = "https://www.twitch.tv/jaidchen/clip/FrailPreciousSalmonSaltBae" // Jaidchen Testi (mine)

/**
 * @param {import("yargs").Arguments<import("src").Options>} argv
 */
export default async argv => {
  await require("./wipe").default(argv) // Faster testing
  if (!argv.url) {
    argv.url = testUrl
  }
  logProperty("Target URL", `${argv.url}`)
  const targetUrl = new TargetUrl(argv.url)
  const platform = new platformMap[targetUrl.type](targetUrl, argv)
  await platform.start()
}