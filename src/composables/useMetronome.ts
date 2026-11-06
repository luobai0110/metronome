import { onUnmounted, ref, watch } from 'vue'
import {
  clampBpm,
  clampIncreaseAmount,
  clampIncreaseInterval,
  increaseBpm,
  secondsPerBeat,
  type IncreaseMode,
} from '@/lib/tempo'
import { remainingSeconds } from '@/lib/timer'

// setInterval only wakes the scheduler; beats themselves are scheduled ahead on the audio clock,
// so playback is not affected by JS timer jitter.
const LOOKAHEAD_MS = 25
const SCHEDULE_AHEAD_S = 0.1
const DEFAULT_BEATS_PER_BAR = 4
const DEFAULT_TIMER_MINUTES = 5
const DEFAULT_RAMP_AMOUNT = 10
const DEFAULT_RAMP_INTERVAL_MINUTES = 1

export function useMetronome(initialBpm = 120, beatsPerBar = DEFAULT_BEATS_PER_BAR) {
  const bpm = ref(clampBpm(initialBpm))
  const isPlaying = ref(false)
  const currentBeat = ref(0) // 0-based position inside the bar
  const accentFirstBeat = ref(true)
  const timerEnabled = ref(false)
  const timerMinutes = ref(DEFAULT_TIMER_MINUTES)
  const remaining = ref(DEFAULT_TIMER_MINUTES * 60)
  const rampEnabled = ref(false)
  const rampMode = ref<IncreaseMode>('fixed')
  const rampAmount = ref(DEFAULT_RAMP_AMOUNT) // BPM for 'fixed', percent for 'percent'
  const rampInterval = ref(DEFAULT_RAMP_INTERVAL_MINUTES)

  let ctx: AudioContext | undefined
  let timer: number | undefined
  let nextBeatAt = 0
  let beatCount = 0
  let timerStopAt = 0
  let countdown: number | undefined
  let rampApplyAt = 0
  let rampStepSeconds = 0
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
    // The ramp rides the audio clock so a throttled tab cannot stretch the interval.
    while (rampEnabled.value && audio.currentTime >= rampApplyAt) {
      bpm.value = increaseBpm(bpm.value, rampMode.value, clampIncreaseAmount(rampAmount.value))
      rampApplyAt += rampStepSeconds
    }
    // Stop scheduling at the timer's end so no click sounds after the countdown hits zero.
    while (nextBeatAt < audio.currentTime + SCHEDULE_AHEAD_S && nextBeatAt < timerStopAt) {
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
    const audio = ctx
    void audio.resume()
    beatCount = 0
    currentBeat.value = 0
    const startedAt = audio.currentTime
    nextBeatAt = startedAt
    timerStopAt = timerEnabled.value ? startedAt + timerMinutes.value * 60 : Infinity
    remaining.value = remainingSeconds(timerMinutes.value * 60, 0)
    isPlaying.value = true
    timer = window.setInterval(schedule, LOOKAHEAD_MS)
    if (timerEnabled.value) {
      // The countdown reads the audio clock, so it stays in step with the beats it stops.
      countdown = window.setInterval(() => {
        const left = remainingSeconds(timerStopAt - startedAt, audio.currentTime - startedAt)
        remaining.value = left
        if (left === 0) stop()
      }, 200)
    }
    rampStepSeconds = clampIncreaseInterval(rampInterval.value) * 60
    rampApplyAt = startedAt + rampStepSeconds
    schedule()
  }

  function stop() {
    isPlaying.value = false
    window.clearInterval(timer)
    window.clearInterval(countdown)
    pendingVisuals.forEach((id) => window.clearTimeout(id))
    pendingVisuals.clear()
  }

  onUnmounted(() => {
    stop()
    void ctx?.close()
  })

  // While idle the countdown mirrors the chosen length, so the display is never stale.
  watch(timerMinutes, (minutes) => {
    if (!isPlaying.value) remaining.value = minutes * 60
  })

  return {
    bpm,
    isPlaying,
    currentBeat,
    beatsPerBar,
    accentFirstBeat,
    timerEnabled,
    timerMinutes,
    remaining,
    rampEnabled,
    rampMode,
    rampAmount,
    rampInterval,
    start,
    stop,
    toggle: () => (isPlaying.value ? stop() : start()),
  }
}
