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
 * @param {number} [expectedRatio=1]
 * @return {string}
 */
function getGrade(speed, expectedRatio = 1) {
  if (speed < 10 * expectedRatio) {
    return "terrible"
  }
  if (speed < 50 * expectedRatio) {
    return "slow"
  }
  if (speed < 80 * expectedRatio) {
    return "acceptable"
  }
  if (speed < 120 * expectedRatio) {
    return "realtime"
  }
  if (speed < 175 * expectedRatio) {
    return "good"
  }
  if (speed < 300 * expectedRatio) {
    return "great"
  }
  if (speed < 1000 * expectedRatio) {
    return "excellent"
  }
  return "extreme"
}

/**
 * @param {number} videoDuration
 * @param {number} encodeDuration
 * @param {number} [expectedRatio=1]
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
export const getEncodeSpeedString = (videoDuration, encodeDuration, expectedRatio = 1) => {
  const speed = getEncodeSpeed(videoDuration, encodeDuration)
  const grade = getGrade(speed, expectedRatio)
  return `${speed}% (${grade})`
}