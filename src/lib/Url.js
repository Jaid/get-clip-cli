export default class extends URL {

  /**
   * @type {string[]}
   */
  pathSegments = null

  constructor(input) {
    super(input)
    if (this.pathname === "/") {
      this.pathSegments = []
    } else {
      this.pathSegments = this.pathname.split("/").slice(1)
    }
  }

}