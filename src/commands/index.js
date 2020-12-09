import TargetUrl from "lib/TargetUrl"

import TwitchClip from "src/handler/twitchClip"

const handlerMap = {
  twitchClip: TwitchClip,
}

/**
 * @param {import("yargs").Arguments<import("src").Options>} argv
 */
export default async argv => {
  argv.url = "https://www.twitch.tv/sullimain/clip/FrailPreciousSalmonSaltBae?filter=clips&range=7d&sort=time"
  const targetUrl = new TargetUrl(argv.url)
  const handler = new handlerMap[targetUrl.type](targetUrl, argv)
  await handler.run()
}