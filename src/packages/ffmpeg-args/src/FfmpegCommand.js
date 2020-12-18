/**
 * @see https://ffmpeg.org/ffmpeg.html
 * @typedef {object} CommandOptions
 * @prop {string} inputFile
 * @prop {string} outputFile
 * @prop {"quiet"|"panic"|"fatal"|"error"|"warning"|"info"|"verbose"|"debug"|"trace"} [logLevel]
 * @prop {"none"|"auto"|"vdpau"|"dxva2"|"vaapi"|"qsv"} [hwAccel]
 * @prop {import("./FfmpegVideoEncoder").default} [videoEncoder]
 * @prop {import("./FfmpegAudioEncoder").default} [audioEncoder]
 */

import {omit} from "lodash"

import Command from "src/lib/Command"

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
    commandArgs.push("-y")
    commandArgs.push("-hide_banner")
    if (options.logLevel) {
      commandArgs.push("-loglevel")
      commandArgs.push(options.logLevel)
    }
    if (options.hwAccel) {
      commandArgs.push("-hwaccel")
      commandArgs.push(options.hwAccel)
    }
    if (options.inputFile) {
      commandArgs.push("-i")
      commandArgs.push(options.inputFile)
    }
    if (options.audioEncoder) {
      for (const arg of options.audioEncoder.toArgs()) {
        commandArgs.push(arg)
      }
    }
    if (options.videoEncoder) {
      for (const arg of options.videoEncoder.toArgs()) {
        commandArgs.push(arg)
      }
    }
    if (options.outputFile) {
      commandArgs.push(options.outputFile)
    }
    return commandArgs
  }

}