import FfmpegVideoEncoder from "./FfmpegVideoEncoder"

/**
 * @typedef {object} Options
 * @prop {string} [cpuUsed] 0 is slowest, 5 is fastest
 * @prop {string} [tiles]
 * @prop {boolean} [rowMt]
 * @prop {number} [quality] 0 best, 63 worst
 * @prop {"good"|"best"|"realtime"} [deadline]
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
    this.options = options || {}
  }

  /**
   * @return {string[]}
   */
  toArgs() {
    const args = super.toArgs()
    args.push("libvpx-vp9")
    args.push("-strict")
    args.push("experimental")
    if (this.options.cpuUsed) {
      args.push("-cpu-used")
      args.push(this.options.cpuUsed)
    }
    if (this.options.rowMt === true) {
      args.push("-row-mt")
      args.push("1")
    }
    if (this.options.rowMt === false) {
      args.push("-row-mt")
      args.push("0")
    }
    if (this.options.tiles) {
      args.push("-tiles")
      args.push(this.options.tiles)
    }
    if (this.options.deadline) {
      args.push("-deadline")
      args.push(this.options.deadline)
    }
    if (this.options.quality !== undefined) {
      args.push("-crf")
      args.push(String(this.options.quality))
      args.push("-b:v")
      args.push("0")
    }
    return args
  }

}