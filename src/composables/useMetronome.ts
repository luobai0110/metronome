import { onUnmounted, ref } from 'vue'
import { clampBpm, secondsPerBeat } from '@/lib/tempo'

// setInterval only wakes the scheduler; beats themselves are scheduled ahead on the audio clock,
// so playback is not affected by JS timer jitter.
const LOOKAHEAD_MS = 25
const SCHEDULE_AHEAD_S = 0.1
const DEFAULT_BEATS_PER_BAR = 4

export function useMetronome(initialBpm = 120, beatsPerBar = DEFAULT_BEATS_PER_BAR) {
  const bpm = ref(clampBpm(initialBpm))
  const isPlaying = ref(false)
  const currentBeat = ref(0) // 0-based position inside the bar
  const accentFirstBeat = ref(true)

  let ctx: AudioContext | undefined
  let timer: number | undefined
  let nextBeatAt = 0
  let beatCount = 0
  const pendingVisuals = new Set<number>()

  function playClick(time: number, accent: boolean) {
    if (!ctx) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = accent ? 1600 : 1000
    gain.gain.setValueAtTime(accent ? 0.8 : 0.5, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05)
    osc.connect(gain).connect(ctx.destination)
    osc.start(time)
    osc.stop(time + 0.05)
  }

  function schedule() {
    const audio = ctx
    if (!audio) return
    while (nextBeatAt < audio.currentTime + SCHEDULE_AHEAD_S) {
      const at = nextBeatAt
      const index = beatCount % beatsPerBar
      playClick(at, index === 0 && accentFirstBeat.value)
      // The bar indicator follows the audio clock: undo the lookahead with a timer.
      const id = window.setTimeout(
        () => {
          pendingVisuals.delete(id)
          currentBeat.value = index
        },
        (at - audio.currentTime) * 1000,
      )
      pendingVisuals.add(id)
      beatCount++
      nextBeatAt += secondsPerBeat(bpm.value)
    }
  }

  function start() {
    if (isPlaying.value) return
    ctx ??= new AudioContext()
    void ctx.resume()
    beatCount = 0
    currentBeat.value = 0
    nextBeatAt = ctx.currentTime
    isPlaying.value = true
    timer = window.setInterval(schedule, LOOKAHEAD_MS)
    schedule()
  }

  function stop() {
    isPlaying.value = false
    window.clearInterval(timer)
    pendingVisuals.forEach((id) => window.clearTimeout(id))
    pendingVisuals.clear()
  }

  onUnmounted(() => {
    stop()
    void ctx?.close()
  })

  return {
    bpm,
    isPlaying,
    currentBeat,
    beatsPerBar,
    accentFirstBeat,
    start,
    stop,
    toggle: () => (isPlaying.value ? stop() : start()),
  }
}
