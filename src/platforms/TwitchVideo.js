import filenamifyShrink from "filenamify-shrink"
import findByExtension from "find-by-extension"
import fs from "fs/promises"
import globby from "globby"
import normalizePath from "normalize-path"
import readableMs from "readable-ms"
import tempy from "tempy"
import {ClientCredentialsAuthProvider} from "twitch-auth"

import AutosubCommand from "lib/AutosubCommand"
import config from "lib/config"
import {getEncodeSpeedString} from "lib/getEncodeSpeed"
import logger from "lib/logger"
import pathJoin from "lib/pathJoin"
import Probe from "lib/Probe"

import Twitch from "./Twitch"

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

export default class extends Twitch {

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
   * @return {Promise<void>}
   */
  async beforeRun() {
    if (this.options.helixVideo) {
      this.helixVideo = this.options.helixVideo
    } else {
      const authProvider = new ClientCredentialsAuthProvider(config.twitchClientId, config.twitchClientSecret)
      // const apiClient = new ApiClient({authProvider})
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

  /**
   * @return {string}
   */
  getFileBase() {
    return this.videoData.titleNormalized
  }

  async run() {
    logger.info(`Video: ${this.videoData.title} (${readableMs(this.videoData.duration)})`)
    await this.download(this.videoData.url)
    this.probe = new Probe(this.downloadedFile, this.argv.ffprobePath)
    await this.probe.run()
    const [archiveResult] = await Promise.all([
      this.createArchive(),
      this.createSubtitles({
        autosubOptions: {
          inputFile: this.downloadedFile,
        },
      }),
    ])
    const archiveProbe = new Probe(archiveResult.file, this.argv.ffprobePath)
    await archiveProbe.run()
    // @ts-ignore
    // eslint-disable-next-line no-underscore-dangle
    this.meta.helixVideo = this.helixVideo._data
    this.meta.probe = this.probe.toJson()
    this.meta.archiveProbe = archiveProbe.toJson()
    logger.info(`Encoded “${this.probe.toString()}” to “${archiveProbe.toString()}” with speed ${getEncodeSpeedString(this.probe.duration, archiveResult.runtime)}`)
  }

}