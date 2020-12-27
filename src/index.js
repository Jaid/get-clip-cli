import yargs from "yargs"

import config from "lib/config"

import handleDefaultCommand from "src/commands"
import handleInfoCommand from "src/commands/info"

/**
 * @typedef {Object} Options
 * @prop {string} url
 * @prop {string} ffmpegPath
 * @prop {string} ffprobePath
 * @prop {string} youtubeDlPath
 * @prop {string} autosubPath
 * @prop {string} storageDirectory
 * @prop {string} autosubLanguage
 * @prop {string} encodePreset
 * @prop {boolean} encodeFast
 * @prop {boolean} smallDownload
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
  "autosub-language": {
    description: "Lanuage code of the language spoken in the clip",
    type: "string",
    default: "de-de",
  },
  "encode-preset": {
    description: "General encode preset",
    type: "string",
  },
  "encode-fast": {
    description: "Automatically decide a fast encode preset",
    type: "boolean",
  },
  "small-download": {
    description: "Choose the smallest available files for download",
    type: "boolean",
  },
}

yargs
  .scriptName(process.env.REPLACE_PKG_NAME)
  .version(process.env.REPLACE_PKG_VERSION)
  .command("* [url]", process.env.REPLACE_PKG_DESCRIPTION, commandBuilder, handleDefaultCommand)
  .command("info", "Show versions and info about external tools", commandBuilder, handleInfoCommand)
  .parse()