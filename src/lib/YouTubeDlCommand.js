/**
 * @typedef {object} CommandOptions
 * @prop {string} url
 * @prop {string} [outputFile]
 * @prop {boolean} [writeInfoJson]
 * @prop {boolean} [writeDescription]
 * @prop {boolean} [addMetadata]
 * @prop {boolean} [callHome]
 * @prop {string} [mergeOutputFormat]
 * @prop {string} [format]
 * @prop {boolean} [preferFreeFormats]
 * @prop {string} [audioQuality]
 * @prop {boolean} [extractAudio]
 * @prop {boolean} [xattrs]
 * @prop {string} [ffmpegLocation]
 * @prop {boolean} [preferFfmpeg]
 * @prop {boolean} [preferAvconv]
 * @prop {boolean} [postOverwrites]
 * @prop {string} [postprocessorArgs]
 */

import {omit} from "lodash"

import Command from "./Command"

export default class extends Command {

  /**
   * @type {CommandOptions} options
   */
  commandOptions = null

  /**
   * @param {CommandOptions & import("lib/Command").Options} options
   */
  constructor(options) {
    super(options)
    this.commandOptions = omit(options, "executablePath")
  }

  /**
   * @param {CommandOptions} additionalOptions?
   * @return {string[]}
   */
  buildArguments(additionalOptions) {
    const options = {
      ...this.commandOptions,
      ...additionalOptions,
    }
    const commandArgs = []
    commandArgs.push(options.url)
    if (options.outputFile) {
      commandArgs.push("--output")
      commandArgs.push(options.outputFile)
    }
    if (options.writeInfoJson === true) {
      commandArgs.push("--write-info-json")
    }
    if (options.writeDescription === true) {
      commandArgs.push("--write-description")
    }
    if (options.addMetadata === true) {
      commandArgs.push("--add-metadata")
    }
    if (options.callHome === true) {
      commandArgs.push("--call-home")
    }
    if (options.callHome === false) {
      commandArgs.push("--no-call-home")
    }
    if (options.mergeOutputFormat) {
      commandArgs.push("--merge-output-format")
      commandArgs.push(options.mergeOutputFormat)
    }
    if (options.format) {
      commandArgs.push("--format")
      commandArgs.push(options.format)
    }
    if (options.preferAvconv === true) {
      commandArgs.push("--prefer-avconv")
    }
    if (options.preferFfmpeg === true) {
      commandArgs.push("--prefer-ffmpeg")
    }
    if (options.ffmpegLocation) {
      commandArgs.push("--ffmpeg-location")
      commandArgs.push(options.ffmpegLocation)
    }
    if (options.preferFreeFormats === true) {
      commandArgs.push("--prefer-free-formats")
    }
    if (options.audioQuality) {
      commandArgs.push("--audio-quality")
      commandArgs.push(options.audioQuality)
    }
    if (options.extractAudio === true) {
      commandArgs.push("--extract-audio")
    }
    if (options.xattrs === true) {
      commandArgs.push("--xattrs")
    }
    if (options.postOverwrites === false) {
      commandArgs.push("--no-post-overwrites")
    }
    if (options.postprocessorArgs) {
      commandArgs.push("--postprocessor-args")
      commandArgs.push(options.postprocessorArgs)
    }
    return commandArgs
  }

}