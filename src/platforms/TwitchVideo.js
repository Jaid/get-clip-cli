import filenamifyShrink from "filenamify-shrink"
import readableMs from "readable-ms"
import {ApiClient} from "twitch"
import {ClientCredentialsAuthProvider} from "twitch-auth"

import {propertyColor} from "lib/colors"
import config from "lib/config"
import {getEncodeSpeedString} from "lib/getEncodeSpeed"
import logger from "lib/logger"
import logProperty from "lib/logProperty"

import Platform from "."

/**
 * @typedef {object} VideoData
 * @prop {number} duration Milliseconds
 * @prop {string} title
 * @prop {string} titleNormalized
 * @prop {string} language
 * @prop {Date} creationDate
 * @prop {Date} publishDate
 * @prop {string} thumbnailUrl
 * @prop {string} type
 * @prop {string} url
 * @prop {number} views
 * @prop {string} description
 * @prop {string} ownerId
 * @prop {string} ownerTitle
 * @prop {string} id
 * @prop {string} ownerNameNormalized
 */

export default class extends Platform {

  /**
   * @type {import("twitch").HelixVideo}
   */
  helixVideo = null

  /**
   * @type {VideoData}
   */
  videoData = null

  /**
   * @return {string}
   */
  getFolder() {
    return this.fromStorageDirectory("twitch", this.videoData.ownerNameNormalized, "videos", this.videoData.id)
  }

  /**
   * @return {string}
   */
  getFileBase() {
    return this.videoData.title
  }

  /**
   * @return {Promise<void>}
   */
  async beforeRun() {
    if (this.options.helixVideo) {
      this.helixVideo = this.options.helixVideo
    } else {
      const authProvider = new ClientCredentialsAuthProvider(config.twitchClientId, config.twitchClientSecret)
      const apiClient = new ApiClient({authProvider})
      this.helixVideo = await apiClient.helix.videos.getVideoById(this.targetUrl.id)
    }
    this.videoData = {
      duration: this.helixVideo.durationInSeconds * 1000,
      title: this.helixVideo.title.trim(),
      titleNormalized: filenamifyShrink(this.helixVideo.title).trim(),
      language: this.helixVideo.language,
      creationDate: this.helixVideo.creationDate,
      publishDate: this.helixVideo.publishDate,
      thumbnailUrl: this.helixVideo.thumbnailUrl,
      type: this.helixVideo.type,
      url: this.helixVideo.url,
      views: this.helixVideo.views,
      description: this.helixVideo.description.trim(),
      ownerId: this.helixVideo.userId,
      ownerTitle: this.helixVideo.userDisplayName,
      ownerNameNormalized: this.helixVideo.userDisplayName.toLowerCase(),
      id: this.helixVideo.id,
    }
  }

  async run() {
    logProperty("Video", `${this.videoData.title} (${readableMs(this.videoData.duration)})`)
    const downloadResult = await this.download(this.videoData.url, {
      autosub: true,
    })
    const createArchiveResult = await this.recode({
      inputFile: downloadResult.downloadedFile,
      probe: true,
    })
    // @ts-ignore
    // eslint-disable-next-line no-underscore-dangle
    this.meta.helixVideo = this.helixVideo._data
    this.meta.probe = downloadResult.probe.toJson()
    this.meta.archiveProbe = createArchiveResult.probe.toJson()
    this.meta.downloadedFile = downloadResult.downloadedFile
  }

}