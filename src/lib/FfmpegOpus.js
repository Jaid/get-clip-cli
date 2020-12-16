import FfmpegAudioEncoder from "./FfmpegAudioEncoder"

/**
 * @typedef {object} Options
 * @prop {string} [bitrate]
 * @prop {boolean} [vbr]
 * @prop {number} [compressionLevel]
 * @prop {number} [frameDuration]
 * @prop {"voip"|"audio"|"lowdelay"} [application]
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
    this.options = options || {}
  }

  /**
   * @return {string[]}
   */
  toArgs() {
    const args = super.toArgs()
    args.push("libopus")
    if (this.options.bitrate) {
      args.push("-b:a")
      args.push(this.options.bitrate)
    }
    if (this.options.vbr === true) {
      args.push("-vbr")
      args.push("1")
    }
    if (this.options.vbr === false) {
      args.push("-vbr")
      args.push("0")
    }
    if (this.options.compressionLevel) {
      args.push("-compression_level")
      args.push(String(this.options.compressionLevel))
    }
    if (this.options.frameDuration) {
      args.push("-frame_duration")
      args.push(String(this.options.frameDuration))
    }
    if (this.options.application) {
      args.push("-application")
      args.push(String(this.options.application))
    }
    return args
  }

}