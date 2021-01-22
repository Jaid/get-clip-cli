import ffprobe from "ffprobe"
import moment from "moment"
import prettyBytes from "pretty-bytes"
import readableMs from "readable-ms"
import statSize from "stat-size"
import Stoppuhr from "stoppuhr"

import logger from "./logger"
import {logPropertyDebug} from "./logProperty"

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
 * @prop {Object<string,string>} [tags]
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
  let result = stream.codec_name
  if (stream.profile) {
    result += `-${stream.profile.replace(/ +/g, "-")}`
  }
  if (stream.bit_rate) {
    const bitrate = Math.ceil(stream.bit_rate / 1000)
    result += ` ${bitrate}k`
  }
  return result
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
    logger.debug(`Probe ${this.file}`)
    const stoppuhr = new Stoppuhr
    const [raw, fileSize] = await Promise.all([
      ffprobe(this.file, {
        path: this.ffprobePath,
      }),
      statSize(this.file),
    ])
    const runTime = stoppuhr.total()
    this.raw = raw
    this.fileSize = fileSize
    this.fileSizeText = prettyBytes(fileSize)
    this.streamAdditions = this.raw.streams.map(stream => {
      const newStream = {
        index: stream.index,
      }
      if (stream.tags?.DURATION) {
        // Format: 00:00:06.246000000
        const momentDuration = moment.duration(stream.tags.DURATION)
        newStream.durationMs = momentDuration.asMilliseconds()
      } else if (stream.duration) {
        newStream.durationMs = Math.ceil(Number(stream.duration) * 1000)
      }
      return newStream
    })
    this.video = this.raw.streams.find(stream => stream.codec_type === "video")
    this.audio = this.raw.streams.find(stream => stream.codec_type === "audio")
    const durations = this.streamAdditions.map(stream => stream.durationMs)
    this.duration = Math.max(...durations)
    if (!Number.isFinite(this.duration)) {
      logger.warn(`Duration for “${this.file}” is ${this.duration} (type ${typeof this.duration}) for some reason`)
      logger.warn(`Stream durations: ${durations.map(value => `${value} (type ${typeof value})`).join(", ")}`)
      logger.debug(`Raw ffprobe: ${JSON.stringify(this.raw)}`)
      debugger
    }
    logger.debug(`Probed ${this.file} in ${readableMs(runTime)}: ${this.toString()}`)
  }

  toJson() {
    return {
      raw: this.raw,
      streamAdditions: this.streamAdditions,
      video: this.video,
      audio: this.audio,
      duration: this.duration,
      fileSize: this.fileSize,
      fileSizeText: this.fileSizeText,
    }
  }

  toString() {
    return this.raw.streams.map(streamToString).join(", ")
  }

}