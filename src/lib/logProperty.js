import {propertyColor} from "./colors"
import logger from "./logger"

/**
 * @param {string} key
 * @param {*} value
 * @return {void}
 */
export const logPropertyDebug = (key, value) => {
  logger.debug(propertyColor(`${key}: ${value}`))
}

/**
 * @param {string} key
 * @param {*} value
 * @return {void}
 */
export default (key, value) => {
  logger.info(propertyColor(`${key}: ${value}`))
}