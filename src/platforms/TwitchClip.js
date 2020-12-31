import filenamifyShrink from "filenamify-shrink"
import makeDir from "make-dir"
import readFileJson from "read-file-json"
import readableMs from "readable-ms"
import {ApiClient} from "twitch"
import {ClientCredentialsAuthProvider} from "twitch-auth"

import config from "lib/config"
import FfmpegCommand from "lib/FfmpegCommand"
import {getEncodeSpeedString} from "lib/getEncodeSpeed"
import logger from "lib/logger"
import {makeHevcEncoder, makeOpusEncoder} from "lib/makeEncoder"
import pathJoin from "lib/pathJoin"
import Probe from "lib/Probe"
import secondsToHms from "lib/secondsToHms"
import TargetUrl from "lib/TargetUrl"

import TwitchVideo from "src/platforms/TwitchVideo"

import Platform from "."

/**
 * @typedef {object} KrakenVod
 * @prop {string} id
 * @prop {string} url
 * @prop {number} offset
 * @prop {string} preview_image_url
 */

/**
 * @typedef {object} KrakenClip
 * @prop {string} slug
 * @prop {string} tracking_id
 * @prop {string} url
 * @prop {string} game
 * @prop {string} created_at
 * @prop {number} duration
 * @prop {KrakenVod} vod
 */

/**
 * @param {string} url
 * @return {string}
 */
function getClipIdFromThumbnailUrl(url) {
  const regex = /(7C|\|)(?<id>\d+)/
  return regex.exec(url).groups.id
}

export default class extends Platform {

  /**
   * @type {string}
   */
  youtubeDlDataFile = null

  /**
   * @type {boolean}
   */
  hasVideo = false

  /**
   * @type {import("twitch").HelixVideo}
   */
  helixVideo = null

  /**
   * @type {import("twitch").HelixClip}
   */
  helixClip = null

  /**
   * @type {KrakenClip}
   */
  krakenClip = null

  /**
   * @type {TwitchVideo}
   */
  videoPlatform = null

  /**
   * @return {Promise<void>}
   */
  async prepareVideo() {
    if (!this.helixVideo) {
      throw new Error("Needs helixVideo")
    }
    const videoUrl = new TargetUrl(this.helixVideo.url)
    this.videoPlatform = new TwitchVideo(videoUrl, this.argv, {
      helixVideo: this.helixVideo,
    })
    await this.videoPlatform.start()
  }

  async createFromVideo() {
    const outputFolder = this.fromFolder("cut")
    await makeDir(outputFolder)
    const outputFile = pathJoin(outputFolder, this.getFileName("mp4"))
    const ffmpeg = new FfmpegCommand({
      outputFile,
      videoEncoder: makeHevcEncoder(this.argv),
      audioEncoder: makeOpusEncoder(this.argv),
      inputFile: this.videoPlatform.meta.downloadedFile,
      argv: this.argv,
      executablePath: this.argv.ffmpegPath,
      startTime: this.clipData.offset,
      length: this.clipData.duration,
    })
    await ffmpeg.run()
  }

  /**
   * @return Promise<void>
   */
  async beforeRun() {
    const authProvider = new ClientCredentialsAuthProvider(config.twitchClientId, config.twitchClientSecret)
    const apiClient = new ApiClient({authProvider})
    const [helixClip, krakenClip] = await Promise.all([
      apiClient.helix.clips.getClipById(this.targetUrl.clipSlug),
      apiClient.callApi({
        url: `clips/${this.targetUrl.clipSlug}`,
      }),
    ])
    this.helixClip = helixClip
    this.krakenClip = krakenClip
    this.clipData = {
      id: getClipIdFromThumbnailUrl(this.helixClip.thumbnailUrl),
      slug: this.helixClip.id,
      title: this.helixClip.title.trim(),
      titleNormalized: filenamifyShrink(this.helixClip.title).trim(),
      streamerTitle: this.helixClip.broadcasterDisplayName,
      streamerId: this.helixClip.broadcasterDisplayName.toLowerCase(),
      clipperTitle: this.helixClip.creatorDisplayName,
      clipperId: this.helixClip.creatorId,
      views: this.helixClip.views,
      language: this.helixClip.language,
      thumbnailUrl: this.helixClip.thumbnailUrl,
      url: this.helixClip.url,
      creationDate: this.helixClip.creationDate,
      gameTitle: this.krakenClip.game,
      duration: this.krakenClip.duration * 1000,
    }
    logger.info(`Clip: ${this.clipData.title} (${readableMs(this.clipData.duration)})`)
    logger.info(`Clipped by ${this.clipData.clipperTitle} for ${this.clipData.streamerTitle} during ${this.clipData.gameTitle}`)
  }

  /**
   * @return {string}
   */
  getFolder() {
    return this.fromStorageDirectory("twitch", this.clipData.streamerId, "clips", this.clipData.id)
  }

  /**
   * @return {string}
   */
  getFileBase() {
    return this.clipData.titleNormalized
  }

  async run() {
    const alreadyDownloadedFile = await this.getDownloadedVideoFile()
    if (alreadyDownloadedFile) {
      logger.warn(`${alreadyDownloadedFile} already exists`)
      return
    }
    let downloadedFile
    if (this.krakenClip.vod) {
      this.hasVideo = true
      this.clipData.offset = this.krakenClip.vod.offset * 1000
      this.clipData.offsetHms = secondsToHms(this.krakenClip.vod.offset)
      this.clipData.videoId = this.helixClip.videoId
      this.helixVideo = await this.helixClip.getVideo()
      await this.prepareVideo()
    } else {
      logger.warn("Video is not available")
      const downloadResult = await this.download(this.clipData.url, {
        probe: true,
      })
      downloadedFile = downloadResult.downloadedFile
      this.youtubeDlDataFile = this.fromFolder("download", "download.info.json")
      const youtubeDlData = await readFileJson(this.youtubeDlDataFile)
      this.meta.youtubeDl = youtubeDlData
      const archiveResult = await this.recode({
        inputFile: downloadedFile,
        probe: true,
      })
      this.meta.archiveProbe = archiveResult.probe.toJson()
      logger.info(`Recoded “${this.probe.toString()}” to “${archiveResult.probe.toString()}” with speed ${getEncodeSpeedString(archiveResult.probe.duration, archiveResult.runtime)}`)
    }
    await makeDir(this.folder)
    await this.createFromVideo()
    if (downloadedFile) {
      this.probe = new Probe(downloadedFile, this.argv.ffprobePath)
      await this.probe.run()
      this.meta.probe = this.probe.toJson()
    }
    this.meta.clip = this.clipData
    // @ts-ignore
    // eslint-disable-next-line no-underscore-dangle
    this.meta.helixClip = this.helixClip
    this.meta.krakenClip = this.krakenClip
    await this.dumpMeta()
  }

}