import FfmpegVideoEncoder from "./FfmpegVideoEncoder"

/**
 * @typedef {object} Options
 * @prop {string} [preset]
 * @prop {number} [quality]
 */

export default class extends FfmpegVideoEncoder {

  /**
   * @type {Options} options
   */
  options = null

  /**
   * @param {Options} [options]
   */
  constructor(options) {
    super()
    const defaultOptions = {}
    this.options = {
      ...defaultOptions,
      ...options,
    }
  }

  /**
   * @return {string[]}
   */
  toArgs() {
    const args = super.toArgs()
    args.push("libx264")
    if (this.options.preset) {
      args.push("-preset")
      args.push(this.options.preset)
    }
    if (this.options.quality !== undefined) {
      args.push("-crf")
      args.push(String(this.options.quality))
    }
    return args
  }

}