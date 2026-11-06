// Self-check for practice timer math: `node src/lib/timer.check.ts`
import { MAX_MINUTES, MIN_MINUTES, clampMinutes, formatSeconds, remainingSeconds } from './timer.ts'

const clampCases: [number, number][] = [
  [0, MIN_MINUTES],
  [Number.NaN, MIN_MINUTES],
  [5.4, 5],
  [999, MAX_MINUTES],
]

for (const [input, expected] of clampCases) {
  const actual = clampMinutes(input)
  if (actual !== expected) throw new Error(`clampMinutes(${input}) = ${actual}, want ${expected}`)
}

const remainingCases: [number, number, number][] = [
  [300, 0, 300],
  [300, 299.2, 1],
  [300, 300, 0],
  [300, 999, 0],
]

for (const [total, elapsed, expected] of remainingCases) {
  const actual = remainingSeconds(total, elapsed)
  if (actual !== expected) {
    throw new Error(`remainingSeconds(${total}, ${elapsed}) = ${actual}, want ${expected}`)
  }
}

if (formatSeconds(0) !== '00:00') throw new Error('0s must format as 00:00')
if (formatSeconds(65) !== '01:05') throw new Error('65s must format as 01:05')
if (formatSeconds(3599) !== '59:59') throw new Error('3599s must format as 59:59')

console.log('timer ok')
