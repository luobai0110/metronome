// Self-check for tempo math: `pnpm check`
import { MAX_BPM, MIN_BPM, clampBpm, secondsPerBeat } from './tempo.ts'

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

console.log('tempo ok')
