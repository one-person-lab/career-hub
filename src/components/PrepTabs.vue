<script setup lang="ts">
defineProps<{ active: 'jobs' | 'know' | 'war' }>()
const emit = defineEmits<{ (e: 'go', id: string): void }>()
</script>

<template>
  <div class="tabs self-start">
    <button class="tab" :class="active === 'jobs' ? 'tab-active' : ''" @click="emit('go', 'prep')">面试场次</button>
    <button class="tab" :class="active === 'know' ? 'tab-active' : ''" @click="emit('go', 'prep-know')">
      面试问答
    </button>
    <button class="tab" :class="active === 'war' ? 'tab-active' : ''" @click="emit('go', 'warroom')">
      岗位作战室
    </button>
  </div>
</template>
