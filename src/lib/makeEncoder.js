import FfmpegH264 from "src/packages/ffmpeg-args/src/FfmpegH264"
import FfmpegHevc from "src/packages/ffmpeg-args/src/FfmpegHevc"
import FfmpegOpus from "src/packages/ffmpeg-args/src/FfmpegOpus"

/**
 * @param {import("yargs").Arguments<import("src").Options>} argv
 * @param {import("src/packages/ffmpeg-args/src/FfmpegHevc").Options} [encoderOptions]
 * @return {import("src/packages/ffmpeg-args/src/FfmpegHevc").default}
 */
export const makeHevcEncoder = (argv, encoderOptions) => {
  const options = {...encoderOptions}
  if (argv.encodeFast) {
    options.preset = "ultrafast"
  }
  return new FfmpegHevc(options)
}

export const makeH264Encoder = (argv, encoderOptions) => {
  const options = {...encoderOptions}
  if (argv.encodeFast) {
    options.preset = "ultrafast"
  }
  return new FfmpegH264(options)
}

/**
 * @param {import("yargs").Arguments<import("src").Options>} argv
 * @param {import("src/packages/ffmpeg-args/src/FfmpegOpus").Options} [encoderOptions]
 * @return {import("src/packages/ffmpeg-args/src/FfmpegOpus").default}
 */
export const makeOpusEncoder = (argv, encoderOptions) => {
  const options = {...encoderOptions}
  if (argv.encodeFast) {
    options.compressionLevel = 0
  }
  return new FfmpegOpus(options)
}