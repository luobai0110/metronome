<script setup lang="ts">
defineProps<{ value: number }>()
</script>

<template>
  <svg class="icon" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <!-- Each icon draws the note group one beat is split into: ♩ ♫ ♪3 ♬ -->
    <template v-if="value === 1">
      <ellipse cx="9.3" cy="18" rx="3.8" ry="2.7" transform="rotate(-22 9.3 18)" />
      <path
        d="M12.8 17.8V4.8"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
      />
    </template>

    <template v-else-if="value === 2">
      <ellipse cx="6.3" cy="18" rx="3.6" ry="2.6" transform="rotate(-22 6.3 18)" />
      <ellipse cx="16.8" cy="17.2" rx="3.6" ry="2.6" transform="rotate(-22 16.8 17.2)" />
      <path
        d="M9.6 17.8V6.6M20.1 17V5.8"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
      />
      <path d="M9.6 6.6 20.1 5.8v2.3l-10.5.8z" />
    </template>

    <template v-else-if="value === 3">
      <ellipse cx="4" cy="18" rx="2.8" ry="2.1" transform="rotate(-22 4 18)" />
      <ellipse cx="10.6" cy="18" rx="2.8" ry="2.1" transform="rotate(-22 10.6 18)" />
      <ellipse cx="17.2" cy="18" rx="2.8" ry="2.1" transform="rotate(-22 17.2 18)" />
      <path
        d="M6.4 17.8V7.6M13 17.8V7.6M19.6 17.8V7.6"
        fill="none"
        stroke="currentColor"
        stroke-width="1.4"
        stroke-linecap="round"
      />
      <path d="M6.4 7.6h13.2V9.6H6.4z" />
      <text x="13" y="5.6" font-size="4.4" text-anchor="middle" stroke="none">3</text>
    </template>

    <template v-else>
      <ellipse cx="2.8" cy="18" rx="2.4" ry="1.8" transform="rotate(-22 2.8 18)" />
      <ellipse cx="8.1" cy="18" rx="2.4" ry="1.8" transform="rotate(-22 8.1 18)" />
      <ellipse cx="13.4" cy="18" rx="2.4" ry="1.8" transform="rotate(-22 13.4 18)" />
      <ellipse cx="18.7" cy="18" rx="2.4" ry="1.8" transform="rotate(-22 18.7 18)" />
      <path
        d="M5 17.8V6.6M10.3 17.8V6.6M15.6 17.8V6.6M20.9 17.8V6.6"
        fill="none"
        stroke="currentColor"
        stroke-width="1.3"
        stroke-linecap="round"
      />
      <path d="M5 6.6h15.9v1.8H5zM5 9.9h15.9v1.8H5z" />
    </template>
  </svg>
</template>

<style scoped>
.icon {
  display: block;
  width: 1.75rem;
  height: 1.75rem;
}
</style>
