import normalizePath from "normalize-path"
import replaceBasename from "replace-basename"

/**
 * @param {string} file
 * @return {string}
 */
export default file => {
  return normalizePath(replaceBasename(file))
}