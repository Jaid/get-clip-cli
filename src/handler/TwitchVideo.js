import findByExtension from "find-by-extension"
import fs from "fs/promises"
import globby from "globby"
import path from "path"
import tempy from "tempy"
import {ApiClient} from "twitch"
import {ClientCredentialsAuthProvider} from "twitch-auth"

import AutosubCommand from "lib/AutosubCommand"
import config from "lib/config"
import FfmpegAac from "lib/FfmpegAac"
import FfmpegAv1 from "lib/FfmpegAv1"
import FfmpegCommand from "lib/FfmpegCommand"
import FfmpegHevc from "lib/FfmpegHevc"
import FfmpegOpus from "lib/FfmpegOpus"
import logger from "lib/logger"
import YouTubeDlCommand from "lib/YouTubeDlCommand"

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
 * @param {string} folder
 * @return {Promise<string|null>}
 */
async function getSrtFile(folder) {
  const files = await globby(["autosub.*.srt"], {
    cwd: folder,
    absolute: true,
  })
  if (files.length) {
    return files[0]
  }
  return null
}

export default class extends Handler {

  async run() {
    const authProvider = new ClientCredentialsAuthProvider(config.twitchClientId, config.twitchClientSecret)
    // const apiClient = new ApiClient({authProvider})
    const videoData = this.options.videoData
    const ownerName = videoData.ownerTitle.toLowerCase()
    const folder = path.join(this.argv.storageDirectory, "twitch", ownerName, "videos", videoData.id)
    const youtubeDl = new YouTubeDlCommand({
      executablePath: this.argv.youtubeDlPath,
      url: videoData.url,
      outputFile: path.join(folder, "download.%(ext)s"),
      writeInfoJson: true,
      callHome: false,
    })
    await youtubeDl.run()
    const downloadedFile = await getDownloadedVideo(folder)
    const tempFolder = tempy.directory({
      prefix: "autosub-",
    })
    logger.debug(`Using temp folder: ${tempFolder}`)
    const autosub = new AutosubCommand({
      executablePath: this.argv.autosubPath,
      inputFile: downloadedFile,
      outputFile: path.join(tempFolder, "autosub"),
      format: "srt",
      speechLanguage: this.argv.autosubLanguage,
      additionalOutputFiles: "full-src",
    })
    await autosub.run()
    const tempSrtFile = await getSrtFile(tempFolder)
    const srtFile = path.join(folder, "autosub.srt")
    const autosubSourceFile = path.join(folder, "autosub.json")
    const tempAutosubSourceFile = findByExtension("json", {
      cwd: tempFolder,
      absolute: true,
    })
    await fs.copyFile(tempSrtFile, srtFile)
    // @ts-ignore
    await fs.copyFile(tempAutosubSourceFile, autosubSourceFile)
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
  }

}