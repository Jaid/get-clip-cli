import yargs from "yargs"

import config from "lib/config"

import handleDefaultCommand from "src/commands"

/**
 * @typedef {Object} Options
 * @prop {string} ffmpegPath
 * @prop {string} ffprobePath
 * @prop {string} youtubeDlPath
 * @prop {string} autosubPath
 * @prop {string} storageDirectory
 */

/**
 * @type {import("yargs").CommandBuilder}
 */
const commandBuilder = {
  "ffmpeg-path": {
    description: "Path to ffmpeg.exe binary",
    type: "string",
    default: config.ffmpegPath,
  },
  "ffprobe-path": {
    description: "Path to ffprobe.exe binary",
    type: "string",
    default: config.ffprobePath,
  },
  "youtube-dl-path": {
    description: "Path to youtube-dl.exe binary",
    type: "string",
    default: config.youtubeDlPath,
  },
  "autosub-path": {
    description: "Path to autosub.exe binary",
    type: "string",
    default: config.autosubPath,
  },
  "storage-directory": {
    description: "Path to a directory for large storage",
    type: "string",
    default: config.storageDirectory,
  },
}

yargs
  .scriptName(process.env.REPLACE_PKG_NAME)
  .version(process.env.REPLACE_PKG_VERSION)
  .command("* <url>", process.env.REPLACE_PKG_DESCRIPTION, commandBuilder, handleDefaultCommand)
  .parse()