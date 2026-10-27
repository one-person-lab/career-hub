<script setup lang="ts">
import { inline, type Block } from '../data/store'
import MermaidBlock from './MermaidBlock.vue'

/**
 * 全站唯一的块渲染器。
 * DocView（通用板块）、项目成果、知识点都走这里 —— 加一种块类型只改这一个文件。
 */
const props = withDefaults(
  defineProps<{
    blocks: Block[]
    midPrefix: string
    /** compact：卡片内使用，字号与间距收紧 */
    compact?: boolean
  }>(),
  { compact: false },
)

const dense = () => props.compact
</script>

<template>
  <div class="flex flex-col" :class="dense() ? 'gap-2' : 'gap-3'">
    <template v-for="(b, bi) in blocks" :key="bi">
      <p
        v-if="b.type === 'para'"
        :class="dense() ? 'text-[13px] leading-relaxed text-ink-2' : 'text-sm leading-relaxed text-ink-2'"
        v-html="inline(b.text)"
      />

      <h4 v-else-if="b.type === 'h'" class="font-semibold text-ink" :class="b.level === 3 ? 'text-[15px]' : 'text-[13px]'">
        {{ b.text }}
      </h4>

      <div v-else-if="b.type === 'quote'" class="border-l-2 border-brand bg-raised px-3 py-2 rounded-r-md">
        <p v-for="(l, i) in b.lines" :key="i" class="text-sm font-medium leading-relaxed text-ink" v-html="inline(l)" />
      </div>

      <ul v-else-if="b.type === 'list' && !b.ordered" class="flex flex-col" :class="dense() ? 'gap-1' : 'gap-1.5'">
        <li v-for="(it, i) in b.items" :key="i" class="flex gap-2 text-sm leading-relaxed text-ink-2">
          <span class="mt-[8px] h-1 w-1 shrink-0 rounded-full bg-ink-3" />
          <span class="min-w-0" v-html="inline(it)" />
        </li>
      </ul>

      <ol v-else-if="b.type === 'list'" class="flex flex-col" :class="dense() ? 'gap-1' : 'gap-1.5'">
        <li v-for="(it, i) in b.items" :key="i" class="flex gap-2 text-sm leading-relaxed text-ink-2">
          <span class="shrink-0 font-semibold text-ink-3">{{ i + 1 }}.</span>
          <span class="min-w-0" v-html="inline(it)" />
        </li>
      </ol>

      <div v-else-if="b.type === 'table'" class="overflow-x-auto rounded-md border border-line">
        <table class="w-full border-collapse text-[13px]">
          <thead>
            <tr class="bg-base">
              <th v-for="h in b.head" :key="h" class="whitespace-nowrap border-b border-line px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-3">
                {{ h }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(r, i) in b.rows"
              :key="i"
              class="border-b border-line last:border-b-0"
              :class="i % 2 ? 'bg-white/[0.02]' : ''"
            >
              <td v-for="h in b.head" :key="h" class="px-3 py-2 align-top leading-relaxed text-ink-2" v-html="inline(r[h] || '')" />
            </tr>
          </tbody>
        </table>
      </div>

      <MermaidBlock v-else-if="b.type === 'mermaid'" :id="`${midPrefix}-${bi}`" :code="b.text" />

      <pre
        v-else-if="b.type === 'code'"
        class="overflow-x-auto rounded-md border border-line bg-base p-3 font-mono text-xs leading-relaxed text-ink"
      ><code>{{ b.text }}</code></pre>
    </template>
  </div>
</template>
