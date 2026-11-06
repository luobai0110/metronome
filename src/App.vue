<script setup lang="ts">
import { useMetronome } from '@/composables/useMetronome'
import { MAX_BPM, MIN_BPM, clampBpm } from '@/lib/tempo'

const { bpm, isPlaying, currentBeat, beatsPerBar, accentFirstBeat, toggle } = useMetronome(120)
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

input[type='number'] {
  width: 4.5rem;
}

button {
  padding: 0.5rem 2rem;
  font-size: 1rem;
  cursor: pointer;
}
</style>
