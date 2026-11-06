<script setup lang="ts">
import { computed } from 'vue'
import { useMetronome } from '@/composables/useMetronome'
import { MAX_BPM, MIN_BPM, TEMPO_PRESETS, clampBpm } from '@/lib/tempo'
import { MAX_MINUTES, MIN_MINUTES, clampMinutes, formatSeconds } from '@/lib/timer'

const {
  bpm,
  isPlaying,
  currentBeat,
  beatsPerBar,
  accentFirstBeat,
  timerEnabled,
  timerMinutes,
  remaining,
  toggle,
} = useMetronome(120)

const isPreset = computed(() => TEMPO_PRESETS.some((preset) => preset.bpm === bpm.value))
</script>

<template>
  <main class="metronome">
    <h1>节拍器</h1>

    <div class="bar" aria-hidden="true">
      <span
        v-for="beat in beatsPerBar"
        :key="beat"
        class="beat"
        :class="{ active: isPlaying && currentBeat === beat - 1 }"
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

    <button type="button" @click="toggle">{{ isPlaying ? '停止' : '开始' }}</button>
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
  gap: 0.5rem;
}

.beat {
  width: 1.5rem;
  height: 4rem;
  border-radius: 0.25rem;
  background: #d4d4d8;
  transition: background 60ms;
}

.beat.active {
  background: #4f46e5;
}

.bpm {
  display: flex;
  align-items: center;
  gap: 0.75rem;
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

button {
  padding: 0.5rem 2rem;
  font-size: 1rem;
  cursor: pointer;
}
</style>
