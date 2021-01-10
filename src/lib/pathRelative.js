import normalizePath from "normalize-path"
import path from "path"

/**
 * @param {string} from
 * @param {string} to
 * @return {string}
 */
export default (from, to) => {
  return normalizePath(path.relative(from, to))
}