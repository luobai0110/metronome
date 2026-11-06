// Self-check for tempo math: `pnpm check`
import {
  DEFAULT_BEATS_PER_BAR,
  MAX_BPM,
  METER_PRESETS,
  MIN_BPM,
  clampBpm,
  clampIncreaseAmount,
  clampIncreaseInterval,
  clickVoice,
  increaseBpm,
  secondsPerBeat,
  type ClickVoice,
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

// beatIndex, tick, subdivision, accentFirstBeat, accentOffbeat -> expected voice
const voiceCases: [number, number, number, boolean, boolean, ClickVoice][] = [
  [0, 0, 1, true, false, 'accent'],
  [1, 0, 1, true, false, 'beat'],
  [0, 0, 1, false, false, 'beat'],
  [0, 0, 4, true, true, 'accent'],
  [1, 2, 4, true, true, 'offbeat'],
  [1, 2, 4, true, false, 'subdivision'],
  [1, 1, 4, true, true, 'subdivision'],
  [1, 1, 2, true, true, 'offbeat'],
  [1, 1, 3, true, true, 'subdivision'],
]

for (const [beat, tick, sub, accentFirst, accentOff, expected] of voiceCases) {
  const actual = clickVoice(beat, tick, sub, accentFirst, accentOff)
  if (actual !== expected) {
    throw new Error(
      `clickVoice(${beat}, ${tick}, ${sub}, ${accentFirst}, ${accentOff}) = ${actual}, want ${expected}`,
    )
  }
}

// The default meter must be selectable, or the UI cannot show which button is active.
if (!METER_PRESETS.some((meter) => meter.beats === DEFAULT_BEATS_PER_BAR)) {
  throw new Error(`no METER_PRESETS entry with ${DEFAULT_BEATS_PER_BAR} beats`)
}

for (const meter of METER_PRESETS) {
  if (!Number.isInteger(meter.beats) || meter.beats < 2) {
    throw new Error(`METER_PRESETS entry ${meter.label} has invalid beats: ${meter.beats}`)
  }
  if (!/^\d+\/\d+$/.test(meter.label)) {
    throw new Error(`METER_PRESETS entry ${meter.label} is not an x/y label`)
  }
}

console.log('tempo ok')
