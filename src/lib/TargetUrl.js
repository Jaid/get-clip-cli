import {v5} from "uuid"

import Url from "lib/Url"

import logger from "./logger"
import uuidNamespaces from "./uuidNamespaces"

const twitchHost = ["twitch.tv", "www.twitch.tv"]
const youtubeHost = ["www.youtube.com", "youtube.com"]

/**
 * @typedef {"twitchClip"|"twitchVideo"|"youtubeVideo"} PlatformType
 */

/**
 * @typedef {Object} ParseUrlResult
 * @prop {PlatformType} type
 * @prop {string} id
 */

/**
 * @param {import("lib/Url").default} url
 * @return {ParseUrlResult}
 */
function parseUrl(url) {
  const isTwitch = twitchHost.includes(url.hostname)
  const isYouTube = youtubeHost.includes(url.hostname)
  if (isTwitch && url.pathSegments.length > 2 && url.pathSegments[1] === "clip") {
    return {
      type: "twitchClip",
      id: url.pathSegments[2],
    }
  }
  if (isTwitch && url.pathSegments.length > 1 && url.pathSegments[0] === "clip") {
    return {
      type: "twitchClip",
      id: url.pathSegments[1],
    }
  }
  if (url.hostname === "clips.twitch.tv" && url.pathSegments.length > 0) {
    return {
      type: "twitchClip",
      id: url.pathSegments[0],
    }
  }
  if (isTwitch && url.pathSegments.length > 1 && url.pathSegments[0] === "videos") {
    return {
      type: "twitchVideo",
      id: url.pathSegments[1],
    }
  }
  if (isYouTube && url.searchParams.has("v")) {
    return {
      type: "youtubeVideo",
      id: url.searchParams.get("v"),
    }
  }
  if (url.hostname === "youtu.be") {
    return {
      type: "youtubeVideo",
      id: url.pathname,
    }
  }
}

export default class TargetUrl {

  /**
   * @type {Url}
   */
  url = null

  /**
   * @type {PlatformType}
   */
  type = null

  /**
   * @type {string}
   */
  id = null

  /**
   * @param {string} url
   */
  constructor(url) {
    this.url = new Url(url)
    const urlInfo = parseUrl(this.url)
    if (!urlInfo) {
      throw new Error(`Could not extract useful information from url ${url}`)
    }
    this.id = urlInfo.id
    this.type = urlInfo.type
    this.name = `${this.type} ${this.id}`
    this.hashedName = v5(this.name, uuidNamespaces.platformTypes)
  }

  toString() {
    return this.name
  }

}