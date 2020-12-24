/**
 * @see https://ffmpeg.org/ffmpeg.html
 * @typedef {object} CommandOptions
 * @prop {string} inputFile
 * @prop {string} outputFile
 * @prop {"quiet"|"panic"|"fatal"|"error"|"warning"|"info"|"verbose"|"debug"|"trace"} [logLevel]
 * @prop {"none"|"auto"|"vdpau"|"dxva2"|"vaapi"|"qsv"} [hwAccel]
 * @prop {import("./FfmpegVideoEncoder").default} [videoEncoder]
 * @prop {import("./FfmpegAudioEncoder").default} [audioEncoder]
 * @prop {number} [startTime]
 * @prop {number} [endTime]
 * @prop {number} [length]
 */

export default class FfmpegCommandGenerator {

  /**
   * @type {CommandOptions} options
   */
  commandOptions = null

  /**
   * @param {CommandOptions} options
   */
  constructor(options) {
    this.commandOptions = {
      ...options,
    }
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
    if (options.startTime) {
      commandArgs.push("-ss")
      commandArgs.push(`${options.startTime}ms`)
    }
    if (options.inputFile) {
      commandArgs.push("-i")
      commandArgs.push(options.inputFile)
    }
    if (options.length) {
      commandArgs.push("-t")
      commandArgs.push(`${options.length}ms`)
    }
    if (options.endTime) {
      commandArgs.push("-to")
      commandArgs.push(`${options.endTime}ms`)
    }
    if (options.videoEncoder) {
      for (const arg of options.videoEncoder.toArgs()) {
        commandArgs.push(arg)
      }
    }
    if (options.audioEncoder) {
      for (const arg of options.audioEncoder.toArgs()) {
        commandArgs.push(arg)
      }
    }
    if (options.outputFile) {
      commandArgs.push(options.outputFile)
    }
    return commandArgs
  }

}