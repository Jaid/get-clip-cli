import FfmpegAudioEncoder from "./FfmpegAudioEncoder"

/**
 * @typedef {object} Options
 * @prop {8|16|24} [bitsPerSample]
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
      bitsPerSample: 16,
      ...options,
    }
  }

  /**
   * @return {string[]}
   */
  toArgs() {
    const args = super.toArgs()
    args.push(`pcm_s${this.options.bitsPerSample}le`)
    return args
  }

}