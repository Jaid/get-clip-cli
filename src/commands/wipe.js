import fs from "fs-extra"
import pify from "pify"
import prettyBytes from "pretty-bytes"
import readableMs from "readable-ms"

import logger from "lib/logger"

const getFolderSize = pify(require("get-folder-size"))

/**
 * @param {import("yargs").Arguments<import("src").Options>} argv
 */
export default async argv => {
  const startTime = Date.now()
  const size = await getFolderSize(argv.storageDirectory)
  await fs.emptyDir(argv.storageDirectory)
  const newSize = await getFolderSize(argv.storageDirectory)
  logger.info(`Removed ${prettyBytes(size - newSize)} from ${argv.storageDirectory}`)
  logger.info(`Wipe done in ${readableMs(Date.now() - startTime)}`)
}