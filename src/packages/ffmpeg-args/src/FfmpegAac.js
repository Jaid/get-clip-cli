import FfmpegAudioEncoder from "./FfmpegAudioEncoder"

/**
 * @typedef {object} Options
 * @prop {1|2|3|4|5} [quality=5] 5 best, 1 worst
 */

export default class extends FfmpegAudioEncoder {

  /**
   * @type {Options} options
   */
  options = null

  /**
   * @param {Options} [options]
   */
  constructor(options) {
    super()
    this.options = {
      quality: 5,
      ...options,
    }
  }

  /**
   * @return {string[]}
   */
  toArgs() {
    const args = super.toArgs()
    args.push("libfdk_aac")
    if (this.options.quality !== undfined) {
      args.push("-vbr")
      args.push(String(this.options.quality))
    }
    return args
  }

}