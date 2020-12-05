import fsp from "@absolunet/fsp"
import filenamifyShrink from "filenamify-shrink"
import path from "path"
import {ApiClient} from "twitch"
import {ClientCredentialsAuthProvider} from "twitch-auth"

import config from "lib/config"
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
    console.log(config)
    const authProvider = new ClientCredentialsAuthProvider(config.twitchClientId, config.twitchClientSecret)
    const apiClient = new ApiClient({authProvider})
    const clipResponse = await apiClient.helix.clips.getClipById(targetUrl.clipId)
    const clipData = {
      id: clipResponse.id,
      title: clipResponse.title,
      titleNormalized: filenamifyShrink(clipResponse.title),
      streamerTitle: clipResponse.broadcasterDisplayName,
      streamerId: clipResponse.broadcasterDisplayName.toLowerCase(),
      clipperTitle: clipResponse.creatorDisplayName,
      clipperId: clipResponse.creatorId,
      viewCount: clipResponse.views,
      language: clipResponse.language,
      thumbnailUrl: clipResponse.thumbnailUrl,
      videoId: clipResponse.videoId,
      url: clipResponse.url,
    }
    const folder = path.join(argv.storageDirectory, "twitch", clipData.streamerId, "clips", clipData.id)
    const clipDataFile = path.join(folder, "apiData.yml")
    await fsp.outputYaml(clipDataFile, clipData)
    const youtubeDl = new YouTubeDlCommand({
      url: clipData.url,
      outputFile: path.join(folder, `${clipData.titleNormalized}.%(ext)s`),
      writeInfoJson: true,
    })
    await runCommand(argv.youtubeDlPath, youtubeDl.buildCommand())
  }
}