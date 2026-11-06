<script setup lang="ts">
import { computed } from 'vue'
import { useMetronome } from '@/composables/useMetronome'
import {
  INCREASE_MODES,
  MAX_BPM,
  MAX_INCREASE_AMOUNT,
  MAX_INCREASE_INTERVAL,
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

const SUBDIVISIONS = [
  { value: 1, label: '无' },
  { value: 2, label: '八分（2）' },
  { value: 3, label: '三连音（3）' },
  { value: 4, label: '十六分（4）' },
]

// The first beat is the tallest bar and each following beat steps down evenly to 30%.
const barHeights = Array.from(
  { length: beatsPerBar },
  (_, index) => 100 - (index * 70) / Math.max(1, beatsPerBar - 1),
)
</script>

<template>
  <main class="metronome">
    <h1>节拍器</h1>

    <div class="bar" aria-hidden="true">
      <span
        v-for="(height, index) in barHeights"
        :key="index"
        class="beat"
        :class="{ active: isPlaying && currentBeat === index }"
        :style="{ height: `${height}%` }"
      />
    </div>

    <label class="bpm">
      <span>BPM</span>
      <select
        :value="bpm"
        @change="bpm = clampBpm(Number(($event.target as HTMLSelectElement).value))"
      >
        <option v-if="!isPreset" :value="bpm" disabled>自定义 {{ bpm }}</option>
        <option v-for="preset in TEMPO_PRESETS" :key="preset.bpm" :value="preset.bpm">
          {{ preset.bpm }} · {{ preset.name }}
        </option>
      </select>
      <input v-model.number="bpm" type="range" :min="MIN_BPM" :max="MAX_BPM" step="1" />
      <input
        :value="bpm"
        type="number"
        :min="MIN_BPM"
        :max="MAX_BPM"
        @change="bpm = clampBpm(($event.target as HTMLInputElement).valueAsNumber)"
      />
    </label>

    <div class="subdivision">
      <label>
        <span>切分</span>
        <select v-model.number="subdivision">
          <option v-for="option in SUBDIVISIONS" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </label>
      <label class="accent">
        <input v-model="accentOffbeat" type="checkbox" :disabled="subdivision === 1" />
        <span>反拍重音</span>
      </label>
    </div>

    <label class="accent">
      <input v-model="accentFirstBeat" type="checkbox" />
      <span>小节首拍强调音</span>
    </label>

    <div class="timer">
      <label>
        <input v-model="timerEnabled" type="checkbox" />
        <span>定时停止</span>
      </label>
      <template v-if="timerEnabled">
        <input
          v-model.number="timerMinutes"
          type="number"
          :min="MIN_MINUTES"
          :max="MAX_MINUTES"
          step="1"
          @change="timerMinutes = clampMinutes(timerMinutes)"
        />
        <span>分钟</span>
        <output class="remaining">{{ formatSeconds(remaining) }}</output>
      </template>
    </div>

    <div class="ramp">
      <label>
        <input v-model="rampEnabled" type="checkbox" />
        <span>自动增速</span>
      </label>
      <template v-if="rampEnabled">
        <span>每</span>
        <input
          v-model.number="rampInterval"
          type="number"
          :min="MIN_INCREASE_INTERVAL"
          :max="MAX_INCREASE_INTERVAL"
          step="1"
          @change="rampInterval = clampIncreaseInterval(rampInterval)"
        />
        <span>分钟</span>
        <select v-model="rampMode">
          <option v-for="mode in INCREASE_MODES" :key="mode.value" :value="mode.value">
            {{ mode.label }}
          </option>
        </select>
        <input
          v-model.number="rampAmount"
          type="number"
          :min="MIN_INCREASE_AMOUNT"
          :max="MAX_INCREASE_AMOUNT"
          step="1"
          @change="rampAmount = clampIncreaseAmount(rampAmount)"
        />
        <span>{{ rampMode === 'percent' ? '%' : 'BPM' }}</span>
      </template>
    </div>

    <div class="actions">
      <button type="button" @click="toggle">{{ isPlaying ? '停止' : '开始' }}</button>
      <button v-if="isPlaying" type="button" @click="isPaused ? resume() : pause()">
        {{ isPaused ? '继续' : '暂停' }}
      </button>
    </div>
  </main>
</template>

<style scoped>
.metronome {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 2rem;
  font-family: system-ui, sans-serif;
}

.bar {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  height: 4rem;
}

.beat {
  width: 1.5rem;
  border-radius: 0.25rem;
  background: #d4d4d8;
  transition:
    background 60ms,
    height 120ms;
}

.beat.active {
  background: #4f46e5;
}

.bpm {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.subdivision {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.subdivision label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.accent {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.timer {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.ramp {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.remaining {
  min-width: 3.5rem;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

input[type='number'] {
  width: 4.5rem;
}

select {
  padding: 0.25rem;
}

.actions {
  display: flex;
  gap: 0.75rem;
}

button {
  padding: 0.5rem 2rem;
  font-size: 1rem;
  cursor: pointer;
}
</style>
