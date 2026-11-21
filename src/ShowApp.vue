<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  PhTrophy,
  PhPlay,
  PhRows,
  PhRowsPlusBottom,
  PhArrowsOutSimple,
  PhArrowsInSimple,
} from '@phosphor-icons/vue'
import Blocks from './components/Blocks.vue'
import MermaidBlock from './components/MermaidBlock.vue'
import { showCards, type ShowCard, type ShowChapter } from './data/show-store'
import { inline } from './data/types'

/**
 * 面试演示：只读投影，数据来自 generated.show.json。
 * 一次只讲一章 —— 概览先给结果，后面每章一个论点。
 */
interface Step {
  name: string
  chapter: ShowChapter | null
}

const ci = ref(0)
const si = ref(0)
const outlineOpen = ref(true)
const fullscreen = ref(false)
const contentEl = ref<HTMLElement | null>(null)

const active = computed<ShowCard | null>(() => showCards[ci.value] ?? null)

function stepsFor(c: ShowCard | null): Step[] {
  if (!c) return []
  return [{ name: '概览', chapter: null }, ...c.chapters.map((chapter) => ({ name: chapter.name, chapter }))]
}

const steps = computed<Step[]>(() => stepsFor(active.value))

const step = computed<Step | null>(() => steps.value[si.value] ?? null)

/** 有架构图的章给整幅宽度，纯文字的章保持可读的行宽 */
const wide = computed(() => Boolean(step.value?.chapter?.diagrams.length))

function pick(cardIndex: number) {
  ci.value = cardIndex
  si.value = 0
}

function stepTo(index: number) {
  if (index >= 0 && index < steps.value.length) si.value = index
}

/** 章末自动接下一个项目，整套讲完不用手动切 */
function move(dir: 1 | -1) {
  if (!showCards.length) return
  if (dir === 1) {
    if (si.value + 1 < steps.value.length) si.value += 1
    else {
      ci.value = (ci.value + 1) % showCards.length
      si.value = 0
    }
  } else if (si.value > 0) {
    si.value -= 1
  } else {
    ci.value = (ci.value - 1 + showCards.length) % showCards.length
    si.value = stepsFor(showCards[ci.value]).length - 1
  }
}

async function toggleFullscreen() {
  if (document.fullscreenElement) await document.exitFullscreen()
  else await document.documentElement.requestFullscreen()
}

function onKey(e: KeyboardEvent) {
  if (e.metaKey || e.ctrlKey || e.altKey) return
  if (e.key === 'ArrowRight' || e.key === ' ') {
    e.preventDefault()
    move(1)
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    move(-1)
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (showCards.length > 1) pick((ci.value + 1) % showCards.length)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (showCards.length > 1) pick((ci.value - 1 + showCards.length) % showCards.length)
  } else if (e.key === 'f' || e.key === 'F') {
    void toggleFullscreen()
  } else if (e.key === 'o' || e.key === 'O') {
    outlineOpen.value = !outlineOpen.value
  } else if (/^[0-9]$/.test(e.key)) {
    stepTo(Number(e.key))
  }
}

function onFsChange() {
  fullscreen.value = Boolean(document.fullscreenElement)
}

watch([ci, si], () => contentEl.value?.scrollTo({ top: 0 }))

onMounted(() => {
  window.addEventListener('keydown', onKey)
  document.addEventListener('fullscreenchange', onFsChange)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  document.removeEventListener('fullscreenchange', onFsChange)
})
</script>

<template>
  <div class="flex h-screen flex-col bg-base">
    <header class="shrink-0 border-b border-line bg-panel">
      <div class="flex h-11 items-center gap-3 px-5">
        <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] bg-raised text-ink-2">
          <PhTrophy :size="12" weight="bold" />
        </span>
        <h1 class="min-w-0 truncate text-[13px] font-semibold text-ink">{{ active?.title || '项目介绍' }}</h1>
        <span v-if="active?.type" class="chip shrink-0">{{ active.type }}</span>

        <div class="ml-auto flex shrink-0 items-center gap-2">
          <a
            v-if="active?.showLink"
            :href="active.showLink"
            target="_blank"
            rel="noreferrer"
            class="btn btn-primary"
          >
            <PhPlay :size="13" weight="bold" />
            打开现场演示
          </a>
          <button class="btn btn-ghost" title="讲解提纲（O）" @click="outlineOpen = !outlineOpen">
            <PhRowsPlusBottom v-if="!outlineOpen" :size="14" weight="bold" />
            <PhRows v-else :size="14" weight="bold" />
          </button>
          <button class="btn btn-ghost" title="全屏（F）" @click="toggleFullscreen">
            <PhArrowsInSimple v-if="fullscreen" :size="14" weight="bold" />
            <PhArrowsOutSimple v-else :size="14" weight="bold" />
          </button>
        </div>
      </div>

      <div v-if="steps.length" class="flex items-center gap-1 px-3 pb-2">
        <div class="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
          <button
            v-for="(s, i) in steps"
            :key="s.name"
            class="tab shrink-0"
            :class="i === si ? 'tab-active' : ''"
            @click="stepTo(i)"
          >
            <span class="mr-1.5 font-mono text-[10px] text-ink-3">{{ i }}</span>
            {{ s.name }}
          </button>
        </div>
        <span class="shrink-0 pl-3 font-mono text-[11px] text-ink-3">{{ si + 1 }}/{{ steps.length }}</span>
      </div>
    </header>

    <main v-if="!active" class="flex flex-1 items-center justify-center">
      <p class="text-[13px] text-ink-3">还没有可演示的项目。</p>
    </main>

    <div v-else class="grid min-h-0 flex-1" :class="outlineOpen ? 'grid-cols-[220px_minmax(0,1fr)_280px]' : 'grid-cols-[220px_minmax(0,1fr)]'">
      <aside class="hidden min-h-0 flex-col overflow-y-auto border-r border-line bg-panel px-2 py-2 md:flex">
        <div class="group-head mt-1">项目</div>
        <button
          v-for="(c, i) in showCards"
          :key="c.id"
          class="row"
          :class="i === ci ? 'row-active text-ink' : 'text-ink-2 hover:text-ink'"
          @click="pick(i)"
        >
          <span class="min-w-0 flex-1 leading-snug">{{ c.title }}</span>
        </button>
      </aside>

      <div ref="contentEl" class="min-w-0 overflow-y-auto">
        <div
          class="mx-auto flex flex-col gap-5 px-8 py-10"
          :class="wide ? 'min-h-full max-w-[1080px] justify-center' : 'max-w-[880px]'"
        >
          <template v-if="!step?.chapter">
            <p class="text-[26px] font-semibold leading-[1.45] text-ink" v-html="inline(active.oneLine)" />

            <div v-if="active.period || active.role || active.scale" class="flex flex-wrap gap-x-6 gap-y-1.5 text-[13px] text-ink-2">
              <span v-if="active.period">时间 {{ active.period }}</span>
              <span v-if="active.role">角色 {{ active.role }}</span>
              <span v-if="active.scale">规模 {{ active.scale }}</span>
            </div>

            <section v-if="active.impact.length" class="mt-2 flex flex-col gap-3">
              <h2 class="text-[12px] font-semibold uppercase tracking-wide text-ink-3">影响</h2>
              <table class="w-full border-collapse text-[15px]">
                <thead>
                  <tr class="border-b border-line-strong text-left text-[12px] text-ink-3">
                    <th v-for="h in active.impactHead" :key="h" class="py-2 pr-4 font-medium">{{ h }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(r, ri) in active.impact" :key="ri" class="border-b border-line">
                    <td
                      v-for="h in active.impactHead"
                      :key="h"
                      class="py-3 pr-4 align-top leading-relaxed text-ink-2"
                      v-html="inline(r[h] || '')"
                    />
                  </tr>
                </tbody>
              </table>
            </section>
          </template>

          <template v-else>
            <h2 class="text-[24px] font-semibold leading-snug text-ink">{{ step.chapter.name }}</h2>

            <div
              v-for="(code, di) in step.chapter.diagrams"
              :key="di"
              class="flex justify-center py-1"
            >
              <div class="w-full">
                <MermaidBlock
                  :id="`show-${active.id}-${step.chapter.name}-${di}`"
                  :code="code"
                  fit
                />
              </div>
            </div>

            <Blocks
              v-if="step.chapter.blocks.length"
              :blocks="step.chapter.blocks"
              :mid-prefix="`show-${active.id}-${si}`"
              size="lg"
              class="max-w-[880px]"
            />
          </template>
        </div>
      </div>

      <aside
        v-if="outlineOpen"
        class="hidden min-h-0 flex-col overflow-y-auto border-l border-line bg-panel px-4 py-4 lg:flex"
      >
        <h2 class="text-[12px] font-semibold uppercase tracking-wide text-ink-3">讲解提纲</h2>
        <ul v-if="active.outline.length" class="mt-3 flex flex-col gap-2.5">
          <li
            v-for="(line, i) in active.outline"
            :key="i"
            class="text-[13px] leading-relaxed text-ink-2"
            v-html="inline(line)"
          />
        </ul>
        <p v-else class="mt-3 text-[13px] text-ink-3">这张卡还没写提纲。</p>

        <div class="mt-auto flex flex-col gap-1.5 pt-6 text-[11px] text-ink-3">
          <div class="flex items-center gap-2"><span class="kbd">←</span><span class="kbd">→</span>上一章 / 下一章</div>
          <div class="flex items-center gap-2"><span class="kbd">↑</span><span class="kbd">↓</span>上一个 / 下一个项目</div>
          <div class="flex items-center gap-2"><span class="kbd">0</span>–<span class="kbd">9</span>跳到某章</div>
          <div class="flex items-center gap-2"><span class="kbd">F</span>全屏</div>
        </div>
      </aside>
    </div>
  </div>
</template>
