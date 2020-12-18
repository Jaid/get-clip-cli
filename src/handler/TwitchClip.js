import fsp from "@absolunet/fsp"
import ffprobe from "ffprobe"
import filenamifyShrink from "filenamify-shrink"
import globby from "globby"
import path from "path"
import readFileJson from "read-file-json"
import {ApiClient} from "twitch"
import {ClientCredentialsAuthProvider} from "twitch-auth"

import config from "lib/config"
import FfmpegAac from "lib/FfmpegAac"
import FfmpegCommand from "lib/FfmpegCommand"
import FfmpegHevc from "lib/FfmpegHevc"
import FfmpegOpus from "lib/FfmpegOpus"
import logger from "lib/logger"
import secondsToHms from "lib/secondsToHms"
import TargetUrl from "lib/TargetUrl"
import YouTubeDlCommand from "lib/YouTubeDlCommand"

import TwitchVideo from "src/handler/TwitchVideo"

import Handler from "."

/**
 * @param {string} folder
 * @return {Promise<string|null>}
 */
async function getDownloadedVideo(folder) {
  const files = await globby(["download.*", "!*.json"], {
    cwd: folder,
    absolute: true,
  })
  if (files.length) {
    return files[0]
  }
  return null
}

/**
 * @param {string} url
 * @return {string}
 */
function getClipIdFromThumbnailUrl(url) {
  const regex = /(7C|\|)(?<id>\d+)/
  return regex.exec(url).groups.id
}

export default class extends Handler {

  async run() {
    const meta = {}
    const authProvider = new ClientCredentialsAuthProvider(config.twitchClientId, config.twitchClientSecret)
    const apiClient = new ApiClient({authProvider})
    const clipResponse = await apiClient.helix.clips.getClipById(this.targetUrl.clipSlug)
    const krakenClip = await apiClient.callApi({
      url: `clips/${this.targetUrl.clipSlug}`,
    })
    const hasVideo = Boolean(krakenClip.vod)
    const clipData = {
      id: getClipIdFromThumbnailUrl(clipResponse.thumbnailUrl),
      slug: clipResponse.id,
      title: clipResponse.title.trim(),
      titleNormalized: filenamifyShrink(clipResponse.title).trim(),
      streamerTitle: clipResponse.broadcasterDisplayName,
      streamerId: clipResponse.broadcasterDisplayName.toLowerCase(),
      clipperTitle: clipResponse.creatorDisplayName,
      clipperId: clipResponse.creatorId,
      views: clipResponse.views,
      language: clipResponse.language,
      thumbnailUrl: clipResponse.thumbnailUrl,
      url: clipResponse.url,
      creationDate: clipResponse.creationDate,
      gameTitle: krakenClip.game,
      durationSeconds: krakenClip.duration,
    }
    if (hasVideo) {
      clipData.offsetSeconds = krakenClip.vod.offset
      clipData.offsetHms = secondsToHms(krakenClip.vod.offset)
      const videoResponse = await clipResponse.getVideo()
      const videoUrl = new TargetUrl(videoResponse.url)
      const videoData = {
        durationSeconds: videoResponse.durationInSeconds,
        title: videoResponse.title.trim(),
        language: videoResponse.language,
        creationDate: videoResponse.creationDate,
        publishDate: videoResponse.publishDate,
        thumbnailUrl: videoResponse.thumbnailUrl,
        type: videoResponse.type,
        url: videoResponse.url,
        views: videoResponse.views,
        description: videoResponse.description.trim(),
        ownerId: videoResponse.userId,
        ownerTitle: videoResponse.userDisplayName,
        id: videoResponse.id,
      }
      const videoHandler = new TwitchVideo(videoUrl, this.argv, {videoData})
      await videoHandler.run()
      meta.video = videoData
      clipData.videoId = clipResponse.videoId
    } else {
      logger.warn("Video is not available")
    }
    const folder = path.join(this.argv.storageDirectory, "twitch", clipData.streamerId, "clips", clipData.id)
    let downloadedFile = await getDownloadedVideo(folder)
    if (downloadedFile) {
      logger.warn(`${downloadedFile} already exists`)
    }
    const youtubeDl = new YouTubeDlCommand({
      executablePath: this.argv.youtubeDlPath,
      url: clipData.url,
      outputFile: path.join(folder, "download.%(ext)s"),
      writeInfoJson: true,
      callHome: false,
    })
    await youtubeDl.run()
    if (!downloadedFile) {
      downloadedFile = await getDownloadedVideo(folder)
    }
    const youtubeDlDataFile = path.join(folder, "download.info.json")
    const youtubeDlData = await readFileJson(youtubeDlDataFile)
    const ffprobeData = await ffprobe(downloadedFile, {
      path: this.argv.ffprobePath,
    })
    const clipDataFile = path.join(folder, "meta.yml")
    meta.clip = clipData
    meta.youtubeDl = youtubeDlData
    meta.ffprobe = ffprobeData
    const ffmpegOutputFile = path.join(folder, "archive.mp4")
    const videoEncoder = new FfmpegHevc
    const audioEncoder = new FfmpegAac
    const ffmpeg = new FfmpegCommand({
      videoEncoder,
      audioEncoder,
      executablePath: this.argv.ffmpegPath,
      inputFile: downloadedFile,
      outputFile: ffmpegOutputFile,
      hwAccel: "auto",
    })
    await ffmpeg.run()
    await fsp.outputYaml(clipDataFile, meta)
  }

}