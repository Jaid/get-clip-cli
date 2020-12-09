import path from "path"
import {ApiClient} from "twitch"
import {ClientCredentialsAuthProvider} from "twitch-auth"

import config from "lib/config"
import YouTubeDlCommand from "lib/YouTubeDlCommand"

import Handler from "."

export default class extends Handler {

  async run() {
    const authProvider = new ClientCredentialsAuthProvider(config.twitchClientId, config.twitchClientSecret)
    // const apiClient = new ApiClient({authProvider})
    const videoData = this.options.videoData
    const ownerName = videoData.ownerTitle.toLowerCase()
    const folder = path.join(this.argv.storageDirectory, "twitch", ownerName, "videos", videoData.id)
    console.dir(this.options.videoData)
    console.dir(folder)
    const youtubeDl = new YouTubeDlCommand({
      executablePath: this.argv.youtubeDlPath,
      url: videoData.url,
      outputFile: path.join(folder, "download.%(ext)s"),
      writeInfoJson: true,
      callHome: false,
    })
    await youtubeDl.run()
  }

}