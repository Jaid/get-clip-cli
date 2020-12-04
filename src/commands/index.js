import ApiClient from "twitch"
import {ClientCredentialsAuthProvider} from "twitch-auth"

import runCommand from "lib/runCommand"
import TargetUrl from "lib/TargetUrl"
import YouTubeDlCommand from "lib/YouTubeDlCommand"

/**
 * @param {import("yargs").Arguments<import("src").Options>} argv
 */
export default async argv => {
  argv.url = "https://www.twitch.tv/sullimain/clip/OnerousObservantStapleTBTacoLeft?filter=clips&range=7d&sort=time"
  const targetUrl = new TargetUrl(argv.url)
  if (targetUrl.type === "twitchClip") {
    const youtubeDl = new YouTubeDlCommand({url: `https://twitch.tv/clip/${targetUrl.clipId}`})
    const cmd = youtubeDl.buildCommand()
    // await runCommand(argv.youtubeDlPath, cmd)
    const authProvider = new ClientCredentialsAuthProvider("clientId", "clientSecret")
    const apiClient = new ApiClient({authProvider})
    // const clip = apiClient.
    debugger
  }
}