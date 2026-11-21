<script setup lang="ts">
import { computed, ref } from 'vue'
import { sections, evidence, pipeline, generatedAt, readCoachHistory, COACH_HISTORY_KEY } from '../data/store'

defineEmits<{ (e: 'go', id: string): void }>()

const docs = computed(() => sections.flatMap((s) => (s.builtin ? [] : s.docs)))
const updated = generatedAt.slice(0, 10).replaceAll('-', ' / ')
const sessions = ref(readCoachHistory())

function clearSessions() {
  localStorage.removeItem(COACH_HISTORY_KEY)
  sessions.value = []
}
</script>

<template>
  <div class="flex w-full max-w-[640px] flex-col gap-7">
    <section>
      <h2 class="mb-2 text-[12px] leading-[18px] text-ink-3">内容</h2>
      <div class="flex flex-col gap-2 text-[13px] leading-[20px] text-ink-2">
        <p>文章 {{ docs.length }} 篇 · 成果 {{ evidence.length }} 条 · 岗位 {{ pipeline.length }} 个</p>
        <p class="text-[12px] text-ink-3">最后更新 {{ updated }}</p>
      </div>
    </section>

    <section>
      <h2 class="mb-2 text-[12px] leading-[18px] text-ink-3">快捷键</h2>
      <div class="flex flex-col gap-1.5 text-[13px] leading-[20px] text-ink-2">
        <p class="flex items-center gap-2"><span class="kbd">Cmd</span><span class="kbd">K</span>搜索并跳转</p>
        <p class="flex items-center gap-2"><span class="kbd">1</span>–<span class="kbd">5</span>切换左侧页面</p>
        <p class="flex items-center gap-2"><span class="kbd">Cmd</span><span class="kbd">Enter</span>模拟问答里交卷</p>
      </div>
    </section>

    <section>
      <h2 class="mb-2 text-[12px] leading-[18px] text-ink-3">练习记录</h2>
      <p v-if="!sessions.length" class="text-[13px] leading-[20px] text-ink-2">还没有练过。</p>
      <div v-else class="flex items-center gap-3">
        <p class="flex-1 text-[13px] leading-[20px] text-ink-2">本机存了 {{ sessions.length }} 场。</p>
        <button class="btn" @click="clearSessions">清空</button>
      </div>
    </section>
  </div>
</template>
