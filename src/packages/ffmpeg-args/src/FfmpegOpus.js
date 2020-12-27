import FfmpegAudioEncoder from "./FfmpegAudioEncoder"

/**
 * @typedef {object} Options
 * @prop {string} [bitrate="64k"]
 * @prop {boolean} [vbr=true]
 * @prop {number} [compressionLevel]
 * @prop {number} [frameDuration=60]
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
    this.options = {
      bitrate: "64k",
      vbr: true,
      compressionLevel: 10,
      ...options,
    }
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
    if (this.options.compressionLevel !== undefined) {
      args.push("-compression_level")
      args.push(String(this.options.compressionLevel))
    }
    if (this.options.frameDuration !== undefined) {
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