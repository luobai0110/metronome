<script setup lang="ts">
import { computed } from 'vue'
import SubdivisionIcon from '@/components/SubdivisionIcon.vue'
import { useMetronome } from '@/composables/useMetronome'
import {
  INCREASE_MODES,
  MAX_BPM,
  MAX_INCREASE_AMOUNT,
  MAX_INCREASE_INTERVAL,
  METER_PRESETS,
  MIN_BPM,
  MIN_INCREASE_AMOUNT,
  MIN_INCREASE_INTERVAL,
  TEMPO_PRESETS,
  clampBpm,
  clampIncreaseAmount,
  clampIncreaseInterval,
} from '@/lib/tempo'
import { MAX_MINUTES, MIN_MINUTES, clampMinutes, formatSeconds } from '@/lib/timer'

const {
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
  toggle,
  pause,
  resume,
} = useMetronome(120)

const isPreset = computed(() => TEMPO_PRESETS.some((preset) => preset.bpm === bpm.value))

// Icon-only choices; the label stays for screen readers and the tooltip.
const SUBDIVISIONS = [
  { value: 1, label: '无切分' },
  { value: 2, label: '八分音符' },
  { value: 3, label: '三连音' },
  { value: 4, label: '十六分音符' },
]

// The first beat is the tallest bar and each following beat steps down evenly to 30%.
const barHeights = computed(() =>
  Array.from(
    { length: beatsPerBar.value },
    (_, index) => 100 - (index * 70) / Math.max(1, beatsPerBar.value - 1),
  ),
)

const meterLabel = computed(
  () => METER_PRESETS.find((meter) => meter.beats === beatsPerBar.value)?.label ?? '4/4',
)
</script>

<template>
  <main class="metronome">
    <header class="headline">
      <h1>节拍器</h1>
      <p class="subtitle">{{ meterLabel }} 拍</p>
    </header>

    <div class="layout">
      <section class="stage">
        <div class="bar" aria-hidden="true">
          <span
            v-for="(height, index) in barHeights"
            :key="index"
            class="beat"
            :class="{ active: isPlaying && currentBeat === index }"
            :style="{ height: `${height}%` }"
          />
        </div>

        <p class="tempo">
          <span class="tempo-value">{{ bpm }}</span>
          <span class="tempo-unit">BPM</span>
        </p>

        <p v-if="timerEnabled" class="remaining">剩余 {{ formatSeconds(remaining) }}</p>

        <div class="actions">
          <button class="primary" type="button" @click="toggle">
            {{ isPlaying ? '停止' : '开始' }}
          </button>
          <button v-if="isPlaying" type="button" @click="isPaused ? resume() : pause()">
            {{ isPaused ? '继续' : '暂停' }}
          </button>
        </div>
      </section>

      <aside class="controls">
        <section class="card">
          <h2>速度</h2>
          <div class="field">
            <label class="field-label" for="bpm-preset">预设</label>
            <select
              id="bpm-preset"
              :value="bpm"
              @change="bpm = clampBpm(Number(($event.target as HTMLSelectElement).value))"
            >
              <option v-if="!isPreset" :value="bpm" disabled>自定义 {{ bpm }}</option>
              <option v-for="preset in TEMPO_PRESETS" :key="preset.bpm" :value="preset.bpm">
                {{ preset.bpm }} · {{ preset.name }}
              </option>
            </select>
          </div>
          <div class="field">
            <label class="field-label" for="bpm-range">BPM</label>
            <input id="bpm-range" v-model.number="bpm" type="range" :min="MIN_BPM" :max="MAX_BPM" />
            <input
              aria-label="BPM 数值"
              :value="bpm"
              type="number"
              :min="MIN_BPM"
              :max="MAX_BPM"
              @change="bpm = clampBpm(($event.target as HTMLInputElement).valueAsNumber)"
            />
          </div>
        </section>

        <section class="card">
          <h2>节奏</h2>
          <div class="field">
            <span class="field-label">拍号</span>
            <div class="meters" role="radiogroup" aria-label="拍号">
              <label
                v-for="meter in METER_PRESETS"
                :key="meter.beats"
                class="meter-option"
                :title="meter.name"
              >
                <input
                  v-model.number="beatsPerBar"
                  type="radio"
                  name="meter"
                  :value="meter.beats"
                />
                <span>{{ meter.label }}</span>
                <span class="visually-hidden">{{ meter.name }}</span>
              </label>
            </div>
          </div>
          <div class="field">
            <span class="field-label">切分</span>
            <div class="subdivisions" role="radiogroup" aria-label="切分音类型">
              <label
                v-for="option in SUBDIVISIONS"
                :key="option.value"
                class="sub-option"
                :title="option.label"
              >
                <input
                  v-model.number="subdivision"
                  type="radio"
                  name="subdivision"
                  :value="option.value"
                />
                <SubdivisionIcon :value="option.value" />
                <span class="visually-hidden">{{ option.label }}</span>
              </label>
            </div>
          </div>
          <label class="check">
            <input v-model="accentOffbeat" type="checkbox" :disabled="subdivision === 1" />
            <span>反拍重音</span>
          </label>
          <label class="check">
            <input v-model="accentFirstBeat" type="checkbox" />
            <span>小节首拍强调音</span>
          </label>
        </section>

        <section class="card">
          <h2>练习</h2>
          <label class="check">
            <input v-model="timerEnabled" type="checkbox" />
            <span>定时停止</span>
          </label>
          <div v-if="timerEnabled" class="field">
            <label class="field-label" for="timer-minutes">时长</label>
            <input
              id="timer-minutes"
              v-model.number="timerMinutes"
              type="number"
              :min="MIN_MINUTES"
              :max="MAX_MINUTES"
              step="1"
              @change="timerMinutes = clampMinutes(timerMinutes)"
            />
            <span class="suffix">分钟</span>
          </div>
          <label class="check">
            <input v-model="rampEnabled" type="checkbox" />
            <span>自动增速</span>
          </label>
          <template v-if="rampEnabled">
            <div class="field">
              <label class="field-label" for="ramp-interval">间隔</label>
              <input
                id="ramp-interval"
                v-model.number="rampInterval"
                type="number"
                :min="MIN_INCREASE_INTERVAL"
                :max="MAX_INCREASE_INTERVAL"
                step="1"
                @change="rampInterval = clampIncreaseInterval(rampInterval)"
              />
              <span class="suffix">分钟</span>
            </div>
            <div class="field">
              <label class="field-label" for="ramp-mode">增速</label>
              <select id="ramp-mode" v-model="rampMode">
                <option v-for="mode in INCREASE_MODES" :key="mode.value" :value="mode.value">
                  {{ mode.label }}
                </option>
              </select>
            </div>
            <div class="field">
              <label class="field-label" for="ramp-amount">幅度</label>
              <input
                id="ramp-amount"
                v-model.number="rampAmount"
                type="number"
                :min="MIN_INCREASE_AMOUNT"
                :max="MAX_INCREASE_AMOUNT"
                step="1"
                @change="rampAmount = clampIncreaseAmount(rampAmount)"
              />
              <span class="suffix">{{ rampMode === 'percent' ? '%' : 'BPM' }}</span>
            </div>
          </template>
        </section>
      </aside>
    </div>
  </main>
</template>

<style scoped>
:global(*) {
  box-sizing: border-box;
}

:global(body) {
  margin: 0;
  min-height: 100vh;
  background-color: #f4f4f5;
  background-image: radial-gradient(circle at 50% 0%, #eef2ff 0%, rgb(244 244 245 / 0%) 55%);
  color: #18181b;
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    'Noto Sans SC',
    sans-serif;
  -webkit-font-smoothing: antialiased;
}

.metronome {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  justify-content: center;
  width: min(100% - 2.5rem, 60rem);
  min-height: 100vh;
  margin: 0 auto;
  padding: 2.5rem 0;
}

.headline {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.headline h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 650;
}

.subtitle {
  margin: 0;
  color: #71717a;
  font-size: 0.875rem;
}

.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 21rem;
  gap: 1.25rem;
  align-items: stretch;
}

@media (max-width: 56rem) {
  .layout {
    grid-template-columns: minmax(0, 1fr);
  }
}

.stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding: 2.5rem 2rem;
  border-radius: 1.25rem;
  background: #ffffff;
  box-shadow:
    0 1px 2px rgb(24 24 27 / 6%),
    0 12px 32px -12px rgb(24 24 27 / 14%);
}

.bar {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  height: 7rem;
}

.beat {
  width: 2rem;
  border-radius: 0.5rem 0.5rem 0.25rem 0.25rem;
  background: #e4e4e7;
  transition:
    background 80ms linear,
    box-shadow 120ms linear;
}

.beat.active {
  background: linear-gradient(180deg, #6366f1, #4f46e5);
  box-shadow: 0 6px 16px -6px #4f46e5;
}

.tempo {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  margin: 0;
}

.tempo-value {
  font-size: 3.5rem;
  font-weight: 650;
  line-height: 1;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}

.tempo-unit {
  color: #71717a;
  font-size: 0.875rem;
  letter-spacing: 0.08em;
}

.remaining {
  margin: -0.75rem 0 0;
  color: #71717a;
  font-size: 0.9375rem;
  font-variant-numeric: tabular-nums;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  width: 100%;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.125rem 1.25rem;
  border: 1px solid #e4e4e7;
  border-radius: 1rem;
  background: #ffffff;
}

.card h2 {
  margin: 0;
  color: #a1a1aa;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.1em;
}

.field {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.field-label,
.suffix {
  flex: none;
  color: #52525b;
  font-size: 0.875rem;
}

.field-label {
  min-width: 3.5rem;
}

.check {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #3f3f46;
  font-size: 0.875rem;
  cursor: pointer;
}

.subdivisions {
  display: grid;
  flex: 1;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.5rem;
}

.meters {
  display: flex;
  flex: 1;
  gap: 0.375rem;
}

.meter-option {
  position: relative;
  flex: 1;
  display: grid;
  place-items: center;
  padding: 0.4rem 0;
  border: 1px solid #e4e4e7;
  border-radius: 0.5rem;
  color: #52525b;
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  transition:
    background 120ms,
    border-color 120ms,
    color 120ms;
}

.meter-option:hover {
  border-color: #c7c7cd;
  background: #fafafa;
}

.meter-option:has(input:checked) {
  border-color: transparent;
  background: #4f46e5;
  color: #ffffff;
}

.meter-option:has(input:focus-visible) {
  outline: 2px solid #4f46e5;
  outline-offset: 2px;
}

.meter-option input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.sub-option {
  position: relative;
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  border: 1px solid #e4e4e7;
  border-radius: 0.75rem;
  color: #52525b;
  cursor: pointer;
  transition:
    background 120ms,
    border-color 120ms,
    color 120ms;
}

.sub-option:hover {
  border-color: #c7c7cd;
  background: #fafafa;
}

.sub-option:has(input:checked) {
  border-color: transparent;
  background: #4f46e5;
  color: #ffffff;
}

.sub-option:has(input:focus-visible) {
  outline: 2px solid #4f46e5;
  outline-offset: 2px;
}

.sub-option input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.check input:disabled + span {
  opacity: 0.45;
}

select,
input[type='number'] {
  height: 2.25rem;
  padding: 0 0.5rem;
  border: 1px solid #e4e4e7;
  border-radius: 0.5rem;
  background: #ffffff;
  color: inherit;
  font: inherit;
  font-size: 0.875rem;
}

select {
  flex: 1;
  min-width: 0;
}

input[type='number'] {
  width: 4.5rem;
  flex: none;
  font-variant-numeric: tabular-nums;
}

input[type='range'] {
  flex: 1;
  min-width: 0;
  accent-color: #4f46e5;
}

input[type='checkbox'] {
  width: 1rem;
  height: 1rem;
  margin: 0;
  accent-color: #4f46e5;
}

select:focus-visible,
input:focus-visible,
button:focus-visible {
  outline: 2px solid #4f46e5;
  outline-offset: 2px;
}

button {
  min-width: 7.5rem;
  padding: 0.75rem 1.75rem;
  border: 1px solid #e4e4e7;
  border-radius: 0.75rem;
  background: #ffffff;
  color: inherit;
  font: inherit;
  font-weight: 500;
  cursor: pointer;
  transition:
    background 120ms,
    border-color 120ms,
    transform 60ms;
}

button:hover {
  background: #f4f4f5;
}

button:active {
  transform: translateY(1px);
}

button.primary {
  border-color: transparent;
  background: #4f46e5;
  color: #ffffff;
  box-shadow: 0 8px 20px -10px #4f46e5;
}

button.primary:hover {
  background: #4338ca;
}
</style>
