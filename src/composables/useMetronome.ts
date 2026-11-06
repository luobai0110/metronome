import { onUnmounted, ref, watch } from 'vue'
import {
  DEFAULT_BEATS_PER_BAR,
  clampBpm,
  clampIncreaseAmount,
  clampIncreaseInterval,
  clickVoice,
  increaseBpm,
  secondsPerBeat,
  type IncreaseMode,
} from '@/lib/tempo'
import { remainingSeconds } from '@/lib/timer'

// setInterval only wakes the scheduler; beats themselves are scheduled ahead on the audio clock,
// so playback is not affected by JS timer jitter.
const LOOKAHEAD_MS = 25
const SCHEDULE_AHEAD_S = 0.1
const DEFAULT_TIMER_MINUTES = 5
const DEFAULT_RAMP_AMOUNT = 10
const DEFAULT_RAMP_INTERVAL_MINUTES = 1

// Four click colours: bar downbeat, plain beat, accented offbeat, plain subdivision tick.
const CLICK = {
  accent: { freq: 1600, gain: 0.8 },
  beat: { freq: 1000, gain: 0.5 },
  offbeat: { freq: 1200, gain: 0.7 },
  subdivision: { freq: 800, gain: 0.25 },
} as const

export function useMetronome(initialBpm = 120, initialBeatsPerBar = DEFAULT_BEATS_PER_BAR) {
  const bpm = ref(clampBpm(initialBpm))
  const isPlaying = ref(false)
  const isPaused = ref(false)
  const currentBeat = ref(0) // 0-based position inside the bar
  const beatsPerBar = ref(initialBeatsPerBar)
  const accentFirstBeat = ref(true)
  const subdivision = ref(1) // ticks per beat: 1 = none, 2 = eighths, 3 = triplets, 4 = sixteenths
  const accentOffbeat = ref(false)
  const timerEnabled = ref(false)
  const timerMinutes = ref(DEFAULT_TIMER_MINUTES)
  const remaining = ref(DEFAULT_TIMER_MINUTES * 60)
  const rampEnabled = ref(false)
  const rampMode = ref<IncreaseMode>('fixed')
  const rampAmount = ref(DEFAULT_RAMP_AMOUNT) // BPM for 'fixed', percent for 'percent'
  const rampInterval = ref(DEFAULT_RAMP_INTERVAL_MINUTES)

  let ctx: AudioContext | undefined
  let master: GainNode | undefined
  let timer: number | undefined
  let countdown: number | undefined
  let nextBeatAt = 0
  let beatCount = 0
  let tickCount = 0 // clicks since start, counted in subdivisions
  // Timing is tracked as "seconds of actually played audio" so pausing does not consume it.
  let elapsedBeforePause = 0
  let segmentStartedAt = 0
  let rampStepsDone = 0
  let rampStepSeconds = 0
  const pendingVisuals = new Set<number>()
  const scheduledClicks = new Set<OscillatorNode>()

  function elapsed(audio: AudioContext): number {
    return isPaused.value
      ? elapsedBeforePause
      : elapsedBeforePause + (audio.currentTime - segmentStartedAt)
  }

  function playClick(time: number, voice: (typeof CLICK)[keyof typeof CLICK]) {
    if (!ctx || !master) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = voice.freq
    gain.gain.setValueAtTime(voice.gain, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05)
    osc.connect(gain).connect(master)
    osc.start(time)
    osc.stop(time + 0.05)
    scheduledClicks.add(osc)
    osc.onended = () => scheduledClicks.delete(osc)
  }

  function schedule() {
    const audio = ctx
    if (!audio || isPaused.value) return
    const played = elapsed(audio)

    // The ramp rides the audio clock so a throttled tab cannot stretch the interval.
    if (rampEnabled.value) {
      const due = Math.floor(played / rampStepSeconds)
      while (rampStepsDone < due) {
        bpm.value = increaseBpm(bpm.value, rampMode.value, clampIncreaseAmount(rampAmount.value))
        rampStepsDone++
      }
    }

    // Never schedule a beat that would land after the countdown ends.
    const left = timerEnabled.value ? timerMinutes.value * 60 - played : Infinity
    while (
      nextBeatAt < audio.currentTime + SCHEDULE_AHEAD_S &&
      nextBeatAt - audio.currentTime < left
    ) {
      const at = nextBeatAt
      const index = beatCount % beatsPerBar.value
      const tick = tickCount % subdivision.value
      const isDownbeat = tick === 0
      const voice = clickVoice(
        index,
        tick,
        subdivision.value,
        accentFirstBeat.value,
        accentOffbeat.value,
      )
      playClick(at, CLICK[voice])
      if (isDownbeat) {
        // The bar indicator follows the audio clock: undo the lookahead with a timer.
        const id = window.setTimeout(
          () => {
            pendingVisuals.delete(id)
            currentBeat.value = index
          },
          (at - audio.currentTime) * 1000,
        )
        pendingVisuals.add(id)
      }
      tickCount++
      if (isDownbeat) beatCount++
      nextBeatAt += secondsPerBeat(bpm.value) / subdivision.value
    }
  }

  // Countdown reads the audio clock through elapsed(), so pause freezes it and resume continues it.
  function startCountdown(audio: AudioContext) {
    countdown = window.setInterval(() => {
      const played = elapsed(audio)
      remaining.value = remainingSeconds(timerMinutes.value * 60, played)
      if (played >= timerMinutes.value * 60) stop()
    }, 200)
  }

  function start() {
    if (isPlaying.value) return
    ctx ??= new AudioContext()
    const audio = ctx
    master ??= audio.createGain()
    master.connect(audio.destination)
    master.gain.setValueAtTime(1, audio.currentTime)
    void audio.resume()
    beatCount = 0
    tickCount = 0
    currentBeat.value = 0
    elapsedBeforePause = 0
    segmentStartedAt = audio.currentTime
    nextBeatAt = audio.currentTime
    rampStepsDone = 0
    rampStepSeconds = clampIncreaseInterval(rampInterval.value) * 60
    remaining.value = remainingSeconds(timerMinutes.value * 60, 0)
    isPlaying.value = true
    isPaused.value = false
    timer = window.setInterval(schedule, LOOKAHEAD_MS)
    if (timerEnabled.value) startCountdown(audio)
    schedule()
  }

  function pause() {
    if (!isPlaying.value || isPaused.value) return
    const audio = ctx
    if (!audio) return
    elapsedBeforePause = elapsed(audio)
    isPaused.value = true
    window.clearInterval(timer)
    window.clearInterval(countdown)
    clearPendingVisuals()
    // Clicks already queued on the audio clock are silenced through the output gain.
    master?.gain.setValueAtTime(0, audio.currentTime)
  }

  function resume() {
    if (!isPlaying.value || !isPaused.value) return
    const audio = ctx
    if (!audio) return
    segmentStartedAt = audio.currentTime
    nextBeatAt = audio.currentTime
    master?.gain.setValueAtTime(1, audio.currentTime)
    isPaused.value = false
    timer = window.setInterval(schedule, LOOKAHEAD_MS)
    if (timerEnabled.value) startCountdown(audio)
    schedule()
  }

  function clearPendingVisuals() {
    pendingVisuals.forEach((id) => window.clearTimeout(id))
    pendingVisuals.clear()
  }

  // Clicks are scheduled ahead; cancelling them keeps them from sounding after a stop.
  function clearScheduledClicks() {
    scheduledClicks.forEach((osc) => osc.stop())
    scheduledClicks.clear()
  }

  function stop() {
    isPlaying.value = false
    isPaused.value = false
    elapsedBeforePause = 0
    window.clearInterval(timer)
    window.clearInterval(countdown)
    clearPendingVisuals()
    clearScheduledClicks()
    if (master && ctx) master.gain.setValueAtTime(0, ctx.currentTime)
  }

  onUnmounted(() => {
    stop()
    void ctx?.close()
  })

  // While idle the countdown mirrors the chosen length, so the display is never stale.
  watch(timerMinutes, (minutes) => {
    if (!isPlaying.value) remaining.value = minutes * 60
  })

  // Switching to a shorter meter mid-bar can leave the indicator past the new last beat.
  watch(beatsPerBar, (beats) => {
    if (currentBeat.value >= beats) currentBeat.value = 0
  })

  return {
    bpm,
    isPlaying,
    isPaused,
    currentBeat,
    beatsPerBar,
    accentFirstBeat,
    subdivision,
    accentOffbeat,
    timerEnabled,
    timerMinutes,
    remaining,
    rampEnabled,
    rampMode,
    rampAmount,
    rampInterval,
    start,
    stop,
    pause,
    resume,
    toggle: () => (isPlaying.value ? stop() : start()),
  }
}
