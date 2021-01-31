import filenamifyShrink from "filenamify-shrink"

import FfmpegPcm from "src/packages/ffmpeg-args/src/FfmpegPcm"
import FfmpegProres from "src/packages/ffmpeg-args/src/FfmpegProres"

import Platform from "."

export default class extends Platform {

  /**
   * @return {string}
   */
  getFolder() {
    const rawUploader = this.youtubeDlMeta.uploader || this.youtubeDlMeta.uploader_id
    const uploader = filenamifyShrink(rawUploader).trim()
    return this.fromStorageDirectory("youtube", uploader, "videos", this.youtubeDlMeta.id)
  }

  /**
   * @return {string}
   */
  getFileBase() {
    return this.youtubeDlMeta.title || this.youtubeDlMeta.fulltitle
  }

  async run() {
    const url = `https://youtube.com/watch?v=${this.targetUrl.id}`
    const downloadResult = await this.download(url, {
      autosub: true,
    })
    const createArchiveResult = await this.recode({
      inputFile: downloadResult.downloadedFile,
      fileExtension: "mov",
      probe: true,
      ffmpegOptions: {
        audioEncoder: new FfmpegPcm,
        videoEncoder: new FfmpegProres,
      },
    })
  }

}