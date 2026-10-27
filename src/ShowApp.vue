<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { PhTrophy, PhImage, PhPlay, PhArrowLeft, PhArrowRight } from '@phosphor-icons/vue'
import Blocks from './components/Blocks.vue'
import MermaidBlock from './components/MermaidBlock.vue'
import { showCards, type ShowCard } from './data/show-store'
import { inline } from './data/types'

/**
 * 面试演示：只读投影，数据来自 generated.show.json。
 * 「影响」表和架构图单独前置 —— 面试官先要结果，再要实现。
 */
const idx = ref(0)
const active = computed<ShowCard | null>(() => showCards[idx.value] ?? null)

function select(i: number) {
  idx.value = i
}

function move(step: number) {
  if (showCards.length < 2) return
  idx.value = (idx.value + step + showCards.length) % showCards.length
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') move(1)
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') move(-1)
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="flex h-screen flex-col bg-base">
    <header class="flex h-11 shrink-0 items-center gap-3 border-b border-line bg-panel px-5">
      <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] bg-raised text-ink-2">
        <PhTrophy :size="12" weight="bold" />
      </span>
      <h1 class="min-w-0 truncate text-[13px] font-semibold text-ink">{{ active?.title || '项目介绍' }}</h1>
      <span class="shrink-0 font-mono text-[11px] text-ink-3">
        {{ showCards.length ? `${idx + 1}/${showCards.length}` : '0' }}
      </span>

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
        <button class="btn btn-ghost" :disabled="showCards.length < 2" @click="move(-1)">
          <PhArrowLeft :size="13" weight="bold" />
        </button>
        <button class="btn btn-ghost" :disabled="showCards.length < 2" @click="move(1)">
          <PhArrowRight :size="13" weight="bold" />
        </button>
      </div>
    </header>

    <main v-if="!active" class="flex flex-1 items-center justify-center">
      <p class="text-[13px] text-ink-3">还没有可演示的项目。</p>
    </main>

    <main v-else class="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside class="hidden min-h-0 flex-col overflow-y-auto border-r border-line bg-panel px-2 py-2 lg:flex">
        <div class="group-head mt-1">项目</div>
        <button
          v-for="(c, i) in showCards"
          :key="c.id"
          class="row py-[6px] text-[13px]"
          :class="i === idx ? 'bg-raised text-ink' : 'text-ink-2 hover:text-ink'"
          @click="select(i)"
        >
          <span class="min-w-0 flex-1 truncate">{{ c.title }}</span>
          <span v-if="c.type" class="chip shrink-0">{{ c.type }}</span>
        </button>
      </aside>

      <div class="min-w-0 overflow-y-auto px-5 py-5">
        <div class="mx-auto flex max-w-[920px] flex-col gap-4">
          <section class="panel flex flex-col gap-2 p-4">
            <p v-if="active.oneLine" class="text-[15px] leading-relaxed text-ink" v-html="inline(active.oneLine)" />
            <div class="flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-ink-2">
              <span v-if="active.period">时间 {{ active.period }}</span>
              <span v-if="active.role">角色 {{ active.role }}</span>
              <span v-if="active.scale">规模 {{ active.scale }}</span>
            </div>
          </section>

          <section v-if="active.impact.length" class="panel flex flex-col gap-2 p-4">
            <h2 class="text-[12px] font-semibold text-ink-2">影响</h2>
            <table class="w-full border-collapse text-[13px]">
              <thead>
                <tr class="border-b border-line text-left text-[12px] text-ink-3">
                  <th v-for="h in active.impactHead" :key="h" class="py-1.5 pr-3 font-medium">{{ h }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(r, ri) in active.impact" :key="ri" class="border-b border-line/60">
                  <td
                    v-for="h in active.impactHead"
                    :key="h"
                    class="py-2 pr-3 align-top text-ink-2"
                    v-html="inline(r[h] || '')"
                  />
                </tr>
              </tbody>
            </table>
          </section>

          <section v-if="active.diagrams.length" class="flex flex-col gap-3">
            <div v-for="d in active.diagrams" :key="d.id" class="panel flex flex-col gap-2 p-4">
              <h2 class="flex items-center gap-1.5 text-[12px] font-semibold text-ink-2">
                <PhImage :size="12" weight="regular" />
                {{ d.name }}
              </h2>
              <MermaidBlock :id="`show-${active.id}-${d.id}`" :code="d.code" />
            </div>
          </section>

          <section
            v-for="(ch, ci) in active.chunks"
            :key="ch.name"
            class="panel flex flex-col gap-2 p-4"
          >
            <h2 class="text-[12px] font-semibold text-ink-2">{{ ch.name }}</h2>
            <Blocks :blocks="ch.blocks" :mid-prefix="`show-${active.id}-${ci}`" />
          </section>
        </div>
      </div>
    </main>
  </div>
</template>
