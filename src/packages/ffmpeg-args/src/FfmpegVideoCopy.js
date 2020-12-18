import FfmpegVideoEncoder from "./FfmpegVideoEncoder"

export default class extends FfmpegVideoEncoder {

  /**
   * @return {string[]}
   */
  toArgs() {
    const args = super.toArgs()
    args.push("copy")
    return args
  }

}