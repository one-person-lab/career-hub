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
        :class="dense() ? 'text-[13px] leading-relaxed text-neutral-800' : 'text-sm leading-relaxed text-neutral-800'"
        v-html="inline(b.text)"
      />

      <h4 v-else-if="b.type === 'h'" class="font-black" :class="b.level === 3 ? 'text-base' : 'text-sm'">
        {{ b.text }}
      </h4>

      <div v-else-if="b.type === 'quote'" class="border-l-4 border-black bg-neutral-100/70 px-3 py-2">
        <p v-for="(l, i) in b.lines" :key="i" class="text-sm font-bold leading-relaxed" v-html="inline(l)" />
      </div>

      <ul v-else-if="b.type === 'list' && !b.ordered" class="flex flex-col" :class="dense() ? 'gap-1' : 'gap-1.5'">
        <li v-for="(it, i) in b.items" :key="i" class="flex gap-2 text-sm leading-relaxed">
          <span class="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-black" />
          <span class="min-w-0" v-html="inline(it)" />
        </li>
      </ul>

      <ol v-else-if="b.type === 'list'" class="flex flex-col" :class="dense() ? 'gap-1' : 'gap-1.5'">
        <li v-for="(it, i) in b.items" :key="i" class="flex gap-2 text-sm leading-relaxed">
          <span class="shrink-0 font-black">{{ i + 1 }}.</span>
          <span class="min-w-0" v-html="inline(it)" />
        </li>
      </ol>

      <div v-else-if="b.type === 'table'" class="overflow-x-auto rounded-lg border-2 border-black shadow-neo-sm">
        <table class="w-full border-collapse text-sm">
          <thead>
            <tr class="bg-black text-white">
              <th v-for="h in b.head" :key="h" class="whitespace-nowrap px-3 py-2 text-left font-black">
                {{ h }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(r, i) in b.rows"
              :key="i"
              class="border-t border-black/15"
              :class="i % 2 ? 'bg-neo-yellow/15' : ''"
            >
              <td v-for="h in b.head" :key="h" class="px-3 py-2 align-top leading-relaxed" v-html="inline(r[h] || '')" />
            </tr>
          </tbody>
        </table>
      </div>

      <MermaidBlock v-else-if="b.type === 'mermaid'" :id="`${midPrefix}-${bi}`" :code="b.text" />

      <pre
        v-else-if="b.type === 'code'"
        class="overflow-x-auto rounded-lg border-2 border-black bg-neutral-900 p-3 text-xs leading-relaxed text-neutral-100"
      ><code>{{ b.text }}</code></pre>
    </template>
  </div>
</template>
