import YouTubeDlCommand from "./YouTubeDlCommand"

/**
 * @param {import("yargs").Arguments<import("src").Options>} argv
 * @param {import("src/lib/Command").Options & import("src/lib/YouTubeDlCommand").CommandOptions}commandOptions
 * @return {import("src/lib/YouTubeDlCommand").default}
 */
export default (argv, commandOptions) => {
  const options = {...commandOptions}
  if (argv.smallDownload) {
    options.format = "worst"
  }
  return new YouTubeDlCommand(options)
}