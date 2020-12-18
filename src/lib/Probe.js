import ffprobe from "ffprobe"
import readableMs from "readable-ms"

import logger from "./logger"

/**
 * @typedef {object} ProbeStream
 * @prop {number} index
 * @prop {string} codec_type
 * @prop {string} codec_tag
 * @prop {string} duration
 * @prop {string} profile
 * @prop {string} codec_name
 * @prop {string} codec_long_name
 * @prop {number} bit_rate
 */

/**
 * @typedef {object} ProbeStreamAddition
 * @prop {number} index
 * @prop {number} [durationMs]
 */

/**
 * @typedef {object} Probe
 * @prop {ProbeStream[]} streams
 */

/**
  * @param {ProbeStream} stream
  * @return {string}
  */
function streamToString(stream) {
  return `${stream.codec_name}_${stream.profile} ${Math.ceil(stream.bit_rate / 1000)}k`
}

export default class {

  /**
   * @type {Probe}
   */
  raw = null

  /**
   * @type {ProbeStreamAddition[]}
   */
  streamAdditions = null

  /**
   * @type {ProbeStream}
   */
  video = null

  /**
   * @type {ProbeStream}
   */
  audio = null

  /**
   * @type {number}
   */
  duration = null

  /**
     * @param {string} file
     * @param {string} ffprobePath
     */
  constructor(file, ffprobePath) {
    this.file = file
    this.ffprobePath = ffprobePath
  }

  async run() {
    const startTime = Date.now()
    this.raw = await ffprobe(this.file, {
      path: this.ffprobePath,
    })
    const runtime = Date.now() - startTime
    this.streamAdditions = this.raw.streams.map(stream => {
      const newStream = {
        index: stream.index,
      }
      if (stream.duration) {
        newStream.durationMs = Math.ceil(Number(stream.duration) * 1000)
      }
      return newStream
    })
    this.video = this.raw.streams.find(stream => stream.codec_type === "video")
    this.audio = this.raw.streams.find(stream => stream.codec_type === "audio")
    const durations = this.streamAdditions.map(stream => stream.durationMs)
    this.duration = Math.max(...durations)
    logger.debug(`Probed ${this.file} in ${readableMs(runtime)}: ${this.toString()}`)
  }

  toJson() {
    return {
      raw: this.raw,
      streamAdditions: this.streamAdditions,
      video: this.video,
      audio: this.audio,
      duration: this.duration,
    }
  }

  toString() {
    return this.raw.streams.map(streamToString).join(", ")
  }

}