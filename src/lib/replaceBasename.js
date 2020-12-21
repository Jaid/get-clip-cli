import normalizePath from "normalize-path"
import replaceBasename from "replace-basename"

/**
 * @param {string} file
 * @param {string} newBase
 * @return {string}
 */
export default (file, newBase) => {
  return normalizePath(replaceBasename(file, newBase))
}