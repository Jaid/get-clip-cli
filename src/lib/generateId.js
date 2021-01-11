import {customAlphabet} from "nanoid/async"

/**
 * @param {number} [length=16]
 * @return {Promise<string>}
 */
export default async (length = 16) => {
  const nanoid = customAlphabet("1234567890ABCDEF", length)
  return nanoid()
}