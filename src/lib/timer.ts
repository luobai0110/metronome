export const MIN_MINUTES = 1
export const MAX_MINUTES = 120

export function clampMinutes(minutes: number): number {
  return Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, Math.round(minutes) || MIN_MINUTES))
}

export function remainingSeconds(totalSeconds: number, elapsedSeconds: number): number {
  return Math.max(0, Math.ceil(totalSeconds - elapsedSeconds))
}

export function formatSeconds(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}
