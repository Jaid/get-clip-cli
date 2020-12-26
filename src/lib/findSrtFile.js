import globby from "globby"

/**
 * @param {string} folder
 * @return {Promise<string|null>}
 */
export default async folder => {
  const files = await globby(["autosub.*.srt"], {
    cwd: folder,
    absolute: true,
  })
  if (files.length) {
    return files[0]
  }
  return null
}