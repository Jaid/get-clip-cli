import FfmpegAudioEncoder from "./FfmpegAudioEncoder"

export default class extends FfmpegAudioEncoder {

  /**
   * @return {string[]}
   */
  toArgs() {
    const args = super.toArgs()
    args.push("copy")
    return args
  }

}