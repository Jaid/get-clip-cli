import essentialConfig from "essential-config"

import logger from "lib/logger"

const defaultConfig = {
  ffmpegPath: "E:/Binaries/ffmpeg.exe",
  ffprobePath: "E:/Binaries/ffprobe.exe",
  youtubeDlPath: "E:/Binaries/youtube-dl.exe",
  autosubPath: "E:/Portables/autosub/autosub/autosub.exe",
  storageDirectory: "S:/Clips",
}

const config = essentialConfig(process.env.REPLACE_PKG_TITLE, defaultConfig)

if (!config) {
  logger.warn("Set up default config, please review and edit this file")
}

export const appFolder = config.appFolder
export default config.config || defaultConfig