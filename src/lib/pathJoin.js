import normalizePath from "normalize-path"
import path from "path"

/**
 * @param {...string[]} segments
 * @return {string}
 */
export default (...segments) => {
  return normalizePath(path.join(...segments))
}