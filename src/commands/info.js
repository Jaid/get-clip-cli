import execa from "execa"
import matchArray from "match-array"

import logger from "lib/logger"

const tools = {
  ffmpeg: {
    extractVersion: /version (?<version>.+?) /,
    commandArguments: ["-version"],
    bonusHandler: async argv => {
      const listAccelsResult = await execa(argv.ffmpegPath, ["-hwaccels"])
      const relevantContent = /Hardware acceleration methods:(?<content>.*)/s.exec(listAccelsResult.stdout).groups.content
      const accelsResult = matchArray(/\n(?<code>[\da-z]+)/g, relevantContent)
      return {
        Accels: accelsResult.map(entry => entry.code).join(", "),
      }
    },
  },
  ffprobe: {
    commandArguments: ["-version"],
    extractVersion: /version (?<version>.+?) /,
  },
  youtubeDl: {
    commandArguments: ["--version"],
  },
  autosub: {
    commandArguments: ["--version"],
    extractVersion: /autosub (?<version>.+?) /,
    bonusHandler: async argv => {
      const listLanguagesResult = await execa(argv.autosubPath, ["--list-speech-codes"])
      const extractCodesResult = matchArray(/\n(?<code>[a-z]+-[a-z-]+)/g, listLanguagesResult.stdout)
      const listFormatsResult = await execa(argv.autosubPath, ["--list-formats"])
      const outputFormats = /(?<content>.*)input format/s.exec(listFormatsResult.stdout).groups.content
      const extractOutputFormatsResult = matchArray(/\n(?<code>[.a-z]+)/g, outputFormats)
      return {
        Languages: extractCodesResult.map(entry => entry.code).join(", "),
        Formats: extractOutputFormatsResult.map(entry => entry.code).join(", "),
      }
    },
  },
}

/**
 * @param {import("yargs").Arguments<import("src").Options>} argv
 */
export default async argv => {
  for (const [key, properties] of Object.entries(tools)) {
    logger.info(key)
    /**
     * @type {string}
     */
    // @ts-ignore
    const binaryPath = argv[`${key}Path`]
    const result = await execa(binaryPath, properties.commandArguments)
    logger.info(`| Path:    ${binaryPath}`)
    if (properties.extractVersion) {
      const regexResult = properties.extractVersion.exec(result.stdout)
      logger.info(`| Version: ${regexResult.groups.version}`)
    } else {
      logger.info(`| Version: ${result.stdout}`)
    }
    if (properties.bonusHandler) {
      const handlerResult = await properties.bonusHandler(argv, key, properties)
      for (const [bonusKey, bonusValue] of Object.entries(handlerResult)) {
        logger.info(`| ${bonusKey}: ${bonusValue}`)
      }
    }
  }
}