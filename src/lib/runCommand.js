import execa from "execa"
import readableMs from "readable-ms"

import logger from "./logger"

export default async (executablePath, commandArguments, execaOptions) => {
  logger.info(`${executablePath} ${commandArguments.join(" ")}`)
  const startTime = Date.now()
  const result = execa(executablePath, commandArguments, execaOptions)
  const endTime = Date.now()
  logger.info(`Done in ${readableMs(endTime - startTime)}`)
  return result
}