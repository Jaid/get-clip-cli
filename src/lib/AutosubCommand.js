/**
 * @typedef {object} CommandOptions
 * @prop {string} url
 * @prop {string} inputFile
 * @prop {string} [outputFile]
 * @prop {"ass"|"ass.json"|"json"|"mpl"|"srt"|"ssa"|"sub"|"tmp"|"txt"|"vtt"} [format]
 * @prop {string} [speechLanguage]
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
    const commandArgs = ["--yes"]
    commandArgs.push(options.url)
    if (options.inputFile) {
      commandArgs.push("--input")
      commandArgs.push(options.inputFile)
    }
    if (options.speechLanguage) {
      commandArgs.push("--speech-language")
      commandArgs.push(options.speechLanguage)
    }
    if (options.format) {
      commandArgs.push("--format")
      commandArgs.push(options.format)
    }
    if (options.outputFile) {
      commandArgs.push("--output")
      commandArgs.push(options.outputFile)
    }
    return commandArgs
  }

}