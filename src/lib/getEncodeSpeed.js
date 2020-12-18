/**
 * @param {number} videoDuration
 * @param {number} encodeDuration
 * @return {number}
 */
export default function getEncodeSpeed(videoDuration, encodeDuration) {
  return Math.ceil(videoDuration / encodeDuration * 100)
}

/**
 * @param {number} speed
 * @return {string}
 */
function getGrade(speed) {
  if (speed < 10) {
    return "terrible"
  }
  if (speed < 50) {
    return "slow"
  }
  if (speed < 80) {
    return "acceptable"
  }
  if (speed < 120) {
    return "realtime"
  }
  if (speed < 175) {
    return "good"
  }
  if (speed < 300) {
    return "great"
  }
  if (speed < 1000) {
    return "excellent"
  }
  return "extreme"
}

/**
 * @param {number} videoDuration
 * @param {number} encodeDuration
 * @return {string}
 * 0-10: terrible
 * 10-50: slow
 * 50-80: acceptable
 * 80-120: realtime
 * 120-175: good
 * 175-300: great
 * 300-1000: excellent
 * 1000+: extreme
 */
export const getEncodeSpeedString = (videoDuration, encodeDuration) => {
  const speed = getEncodeSpeed(videoDuration, encodeDuration)
  const grade = getGrade(speed)
  return `${speed}% (${grade})`
}