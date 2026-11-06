export const MIN_BPM = 20
export const MAX_BPM = 300

// Common practice tempos, labelled with the traditional Italian terms.
export const TEMPO_PRESETS = [
  { bpm: 40, name: 'Largo' },
  { bpm: 60, name: 'Larghetto' },
  { bpm: 66, name: 'Adagio' },
  { bpm: 80, name: 'Andante' },
  { bpm: 100, name: 'Moderato' },
  { bpm: 120, name: 'Allegro' },
  { bpm: 152, name: 'Vivace' },
  { bpm: 176, name: 'Presto' },
] as const

export function clampBpm(bpm: number): number {
  return Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(bpm) || MIN_BPM))
}

export function secondsPerBeat(bpm: number): number {
  return 60 / clampBpm(bpm)
}

// Meters offered as buttons; `beats` is how many clicks one bar holds.
export const METER_PRESETS = [
  { beats: 2, label: '2/4', name: '二拍子' },
  { beats: 3, label: '3/4', name: '三拍子' },
  { beats: 4, label: '4/4', name: '四拍子' },
  { beats: 6, label: '6/8', name: '六拍子' },
] as const
export const DEFAULT_BEATS_PER_BAR = 4

// Auto-acceleration: `fixed` adds the same number of BPM each step, `percent` scales the current BPM.
export const INCREASE_MODES = [
  { value: 'fixed', label: '固定 BPM' },
  { value: 'percent', label: '百分比' },
] as const
export type IncreaseMode = (typeof INCREASE_MODES)[number]['value']

export const MIN_INCREASE_INTERVAL = 1
export const MAX_INCREASE_INTERVAL = 60
export const MIN_INCREASE_AMOUNT = 1
export const MAX_INCREASE_AMOUNT = 100

export function clampIncreaseInterval(minutes: number): number {
  return Math.min(
    MAX_INCREASE_INTERVAL,
    Math.max(MIN_INCREASE_INTERVAL, Math.round(minutes) || MIN_INCREASE_INTERVAL),
  )
}

export function clampIncreaseAmount(amount: number): number {
  return Math.min(
    MAX_INCREASE_AMOUNT,
    Math.max(MIN_INCREASE_AMOUNT, Math.round(amount) || MIN_INCREASE_AMOUNT),
  )
}

export function increaseBpm(bpm: number, mode: IncreaseMode, amount: number): number {
  const target = mode === 'percent' ? bpm * (1 + amount / 100) : bpm + amount
  return clampBpm(target)
}

export type ClickVoice = 'accent' | 'beat' | 'offbeat' | 'subdivision'

// Which of the four click sounds a given tick gets.
// `tick` counts subdivisions inside one beat; offbeat is the later half of a subdivided beat.
export function clickVoice(
  beatIndex: number,
  tick: number,
  subdivision: number,
  accentFirstBeat: boolean,
  accentOffbeat: boolean,
): ClickVoice {
  if (tick === 0) return beatIndex === 0 && accentFirstBeat ? 'accent' : 'beat'
  const isOffbeat = subdivision > 1 && tick * 2 === subdivision
  return isOffbeat && accentOffbeat ? 'offbeat' : 'subdivision'
}
