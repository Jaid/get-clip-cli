/**
 * @typedef {object} Result
 * @prop {number} hours
 * @prop {number} minutes
 * @prop {number} seconds
 */

/**
 * @param {number} inputSeconds
 * @return {Result}
 */
export default inputSeconds => {
  let totalSeconds = inputSeconds
  const hours = Math.floor(totalSeconds / 3600)
  totalSeconds %= 3600
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return {
    hours,
    minutes,
    seconds,
  }
}