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
