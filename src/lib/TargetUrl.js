import Url from "lib/Url"

import logger from "./logger"

const twitchHost = ["twitch.tv", "www.twitch.tv"]
const youtubeHost = ["www.youtube.com", "youtube.com"]

export default class {

  /**
   * @type {Url}
   */
  url = null

  /**
   * @type {Object}
   */
  props = {}

  /**
   * @type {"twitchClip"|"twitchVideo"|"youtubeVideo"|null}
   */
  type = null

  /**
   * @param {string} url
   */
  constructor(url) {
    this.url = new Url(url)
    const isTwitch = twitchHost.includes(this.url.hostname)
    const isYouTube = youtubeHost.includes(this.url.hostname)
    if (isTwitch && this.url.pathSegments.length > 2 && this.url.pathSegments[1] === "clip") {
      this.type = "twitchClip"
      this.clipSlug = this.url.pathSegments[2]
    }
    if (isTwitch && this.url.pathSegments.length > 1 && this.url.pathSegments[0] === "clip") {
      this.type = "twitchClip"
      this.clipSlug = this.url.pathSegments[1]
    }
    if (this.url.hostname === "clips.twitch.tv" && this.url.pathSegments.length > 0) {
      this.type = "twitchClip"
      this.clipSlug = this.url.pathSegments[0]
    }
    if (isTwitch && this.url.pathSegments.length > 1 && this.url.pathSegments[0] === "videos") {
      this.type = "twitchVideo"
      this.videoId = this.url.pathSegments[1]
    }
    if (isYouTube && this.url.searchParams.has("v")) {
      this.type = "youtubeVideo"
      this.videoId = this.url.searchParams.get("v")
    }
    if (this.url.hostname === "youtu.be") {
      this.type = "youtubeVideo"
      this.videoId = this.url.pathname
    }
  }

}