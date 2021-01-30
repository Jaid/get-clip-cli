import FfmpegVideoEncoder from "./FfmpegVideoEncoder"

/**
 * @typedef {object} Options
 * @prop {"proxy"|"lt"|"sq"|"hq"|"4444"} [profile="proxy"]
 * @prop {number} [quality=12]
 * @prop {"yuv420p"|"yuv422p"|"yuv444p"|"yuv420p10le"|"yuv422p10le"|"yuv444p10le"} [pixelFormat]
 * @see https://trac.ffmpeg.org/wiki/Encode/VFX
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
    /**
     * @type {Options}
     */
    const defaultOptions = {
      profile: "proxy",
    }
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
    args.push("prores_ks") // Alternatives: prores, prores_aw
    if (this.options.profile !== undefined) {
      args.push("-profile:v")
      args.push(this.options.profile)
    }
    if (this.options.quality !== undefined) {
      args.push("-qscale:v")
      args.push(String(this.options.quality))
    }
    return args
  }

}