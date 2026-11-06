export const MIN_BPM = 20
export const MAX_BPM = 300

export function clampBpm(bpm: number): number {
  return Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(bpm) || MIN_BPM))
}

export function secondsPerBeat(bpm: number): number {
  return 60 / clampBpm(bpm)
}
