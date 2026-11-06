// Self-check for tempo math: `pnpm check`
import {
  MAX_BPM,
  MIN_BPM,
  clampBpm,
  clampIncreaseAmount,
  clampIncreaseInterval,
  increaseBpm,
  secondsPerBeat,
  type IncreaseMode,
} from './tempo.ts'

const cases: [number, number][] = [
  [0, MIN_BPM],
  [Number.NaN, MIN_BPM],
  [120.4, 120],
  [999, MAX_BPM],
]

for (const [input, expected] of cases) {
  const actual = clampBpm(input)
  if (actual !== expected) throw new Error(`clampBpm(${input}) = ${actual}, want ${expected}`)
}

if (secondsPerBeat(60) !== 1) throw new Error('60 BPM must be 1s per beat')
if (secondsPerBeat(120) !== 0.5) throw new Error('120 BPM must be 0.5s per beat')

const intervalCases: [number, number][] = [
  [0, 1],
  [Number.NaN, 1],
  [2.6, 3],
  [999, 60],
]

for (const [input, expected] of intervalCases) {
  const actual = clampIncreaseInterval(input)
  if (actual !== expected) {
    throw new Error(`clampIncreaseInterval(${input}) = ${actual}, want ${expected}`)
  }
}

const amountCases: [number, number][] = [
  [0, 1],
  [Number.NaN, 1],
  [9.6, 10],
  [999, 100],
]

for (const [input, expected] of amountCases) {
  const actual = clampIncreaseAmount(input)
  if (actual !== expected) {
    throw new Error(`clampIncreaseAmount(${input}) = ${actual}, want ${expected}`)
  }
}

const increaseCases: [number, IncreaseMode, number, number][] = [
  [120, 'fixed', 10, 130],
  [120, 'percent', 10, 132],
  [295, 'fixed', 10, MAX_BPM],
  [120, 'percent', 100, 240],
]

for (const [bpm, mode, amount, expected] of increaseCases) {
  const actual = increaseBpm(bpm, mode, amount)
  if (actual !== expected) {
    throw new Error(`increaseBpm(${bpm}, ${mode}, ${amount}) = ${actual}, want ${expected}`)
  }
}

console.log('tempo ok')
