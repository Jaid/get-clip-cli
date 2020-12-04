import Url from "lib/Url"

import logger from "./logger"

const twitchHost = ["twitch.tv", "www.twitch.tv"]

export default class {

  /**
   * @type {URL}
   */
  url = null

  /**
   * @type {Object}
   */
  props = {}

  /**
   * @type {"twitchClip"|null}
   */
  type = null

  constructor(url) {
    this.url = new Url(url)
    if (twitchHost.includes(this.url.hostname) && this.url.pathSegments.length > 2 && this.url.pathSegments[1] === "clip") {
      this.type = "twitchClip"
      this.clipId = this.url.pathSegments[2]
    }
    if (twitchHost.includes(this.url.hostname) && this.url.pathSegments.length > 1 && this.url.pathSegments[0] === "clip") {
      this.type = "twitchClip"
      this.clipId = this.url.pathSegments[1]
    }
  }

}