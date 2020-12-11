import execa from "execa"

import logger from "lib/logger"

const tools = {
  ffmpeg: {
    extractVersion: /version (?<version>.*?) /,
    commandArguments: ["-version"],
  },
  ffprobe: {
    commandArguments: ["-version"],
    extractVersion: /version (?<version>.*?) /,
  },
  youtubeDl: {
    commandArguments: ["--version"],
  },
  autosub: {
    commandArguments: ["--version"],
    extractVersion: /autosub (?<version>.*?) /,
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
  }
}