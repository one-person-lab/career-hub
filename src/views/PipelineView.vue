<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { PhArrowRight, PhCaretRight, PhLightning } from '@phosphor-icons/vue'
import {
  pipeline,
  stageTone,
  evidenceById,
  docsByHost,
  questionsFor,
  isLive,
  inline,
  materialsFor,
  warRoomFor,
  type PipelineRow,
} from '../data/store'
import Blocks from '../components/Blocks.vue'

const emit = defineEmits<{ (e: 'go', id: string): void }>()

/**
 * 面试场次：一场面试一页。
 * 左边选场次，右边是这场面试要的东西 —— 公司做什么、岗位职责、我还没底的点、下一步。
 */

type Filter = 'all' | 'live' | 'done'
const filter = ref<Filter>('all')
const selected = ref<string>('')

const rows = computed(() => {
  const base = filter.value === 'live' ? pipeline.filter(isLive) : filter.value === 'done' ? pipeline.filter((p) => !isLive(p)) : pipeline
  // 有排期的按离现在最近在前，没排期的排后面
  const due = (p: PipelineRow): number => (p.nextIn === null ? Number.POSITIVE_INFINITY : p.nextIn)
  return [...base].sort((a, b) => due(a) - due(b))
})

/** 选中行兜底：默认停在最近一场面试上 */
watch(
  () => rows.value,
  (list) => {
    if (!list.some((p) => p.key === selected.value)) selected.value = list[0]?.key || ''
  },
  { immediate: true },
)

const active = computed(() => pipeline.find((p) => p.key === selected.value))
const brief = computed(() => active.value?.brief)
const bank = computed(() => (active.value ? questionsFor(active.value.company) : []))
const war = computed(() => {
  const r = active.value ? warRoomFor(active.value.company) : undefined
  return r && r.total > 0 ? r : undefined
})
const contextDocs = computed(() => docsByHost('prep-jobs'))
/** 简报已经把公司资料摊开了，这里只留面试记录这类补充材料 */
const noteDocs = computed(() => contextDocs.value.filter((d) => !brief.value || d.id !== 'companies'))
const docId = computed(() =>
  active.value?.companyDoc ? `companies::${active.value.companyDoc}` : '',
)
/** 岗位职责里点到什么技术，就把那个方向下我自己的材料递过来 */
const materials = computed(() =>
  brief.value ? materialsFor([...brief.value.what, ...brief.value.duties, ...brief.value.requirements]) : [],
)

const openReq = ref(false)
watch(selected, () => (openReq.value = false))

/** 缺口三档：没做过、做过相近的、资历超了会被问 */
const GAP_TONE: Record<string, string> = {
  缺: 'text-red',
  部分: 'text-amber',
  超配: 'text-ink-3',
}

const dayLabel = (p: PipelineRow): string =>
  p.nextIn === null ? '' : p.nextIn < 0 ? `已过 ${Math.abs(p.nextIn)} 天` : p.nextIn === 0 ? '今天' : `${p.nextIn} 天后`
</script>

<template>
  <div class="mx-auto flex w-full max-w-[1240px] flex-col gap-4">
    <div v-if="!pipeline.length" class="panel">
      <p class="text-[13px] text-ink-2">还没有岗位记录。</p>
    </div>

    <div v-else class="flex items-start gap-8">
      <!-- 左：场次 -->
      <aside class="w-[246px] shrink-0">
        <div class="flex items-center gap-3 px-1 pb-2 text-[12px]">
          <button
            v-for="f in [
              { id: 'all', label: '全部' },
              { id: 'live', label: '进行中' },
              { id: 'done', label: '已结束' },
            ] as { id: Filter; label: string }[]"
            :key="f.id"
            class="transition-colors"
            :class="filter === f.id ? 'text-ink' : 'text-ink-3 hover:text-ink'"
            @click="filter = f.id"
          >
            {{ f.label }}
          </button>
        </div>

        <button
          v-for="p in rows"
          :key="p.key"
          class="flex w-full flex-col gap-1 border-b border-line px-1 py-2.5 text-left transition-colors last:border-b-0 hover:bg-hover"
          :class="p.key === selected ? 'bg-raised' : ''"
          @click="selected = p.key"
        >
          <span class="flex w-full items-center gap-2">
            <span class="min-w-0 flex-1 truncate text-[13px] font-medium" :class="p.key === selected ? 'text-ink' : 'text-ink-2'">
              {{ p.company }}
            </span>
            <span
              v-if="p.nextIn !== null"
              class="shrink-0 font-mono text-[10px]"
              :class="p.nextIn < 0 ? 'text-red' : 'text-amber'"
            >
              {{ dayLabel(p) }}
            </span>
          </span>
          <span class="flex w-full items-center gap-1.5 text-[12px] text-ink-3">
            <span class="dot shrink-0" :class="stageTone(p.stage)" />
            <span class="min-w-0 flex-1 truncate">{{ p.stage }} · {{ p.role }}</span>
          </span>
        </button>
      </aside>

      <!-- 右：这场面试 -->
      <main v-if="active" class="flex min-w-0 max-w-[780px] flex-1 flex-col gap-7">
        <header>
          <h2 class="text-[20px] font-semibold leading-tight text-ink">{{ active.company }} · {{ active.role }}</h2>
          <p class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-ink-3">
            <span class="flex items-center gap-1.5"><span class="dot" :class="stageTone(active.stage)" />{{ active.stage }}</span>
            <span v-if="active.nextRound">{{ active.nextRound }}</span>
            <span v-if="active.appliedRaw">投于 {{ active.appliedRaw }}</span>
          </p>

          <div class="mt-4 flex flex-wrap items-center gap-2">
            <button v-if="war" class="btn btn-primary" @click="emit('go', 'warroom')">
              <PhLightning :size="13" weight="bold" />
              岗位作战室 {{ war.total }} 题
            </button>
            <button v-if="active.nextIn !== null" class="btn" :class="war ? '' : 'btn-primary'" @click="emit('go', 'coach')">
              <PhLightning :size="13" weight="bold" />
              开始模拟
            </button>
            <button v-if="bank.length" class="btn" @click="emit('go', 'pitch::高频真题')">
              {{ active.company }} 真题 {{ bank.length }} 道
            </button>
            <button v-if="docId" class="btn" @click="emit('go', docId)">完整资料</button>
          </div>

          <div v-if="active.action" class="mt-4 border-l-2 border-amber/60 pl-3">
            <p class="text-[13px] leading-[21px] text-ink-2">{{ active.action }}</p>
          </div>

          <p v-if="brief?.facts.length" class="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-[12px] leading-[18px]">
            <span v-for="f in brief.facts" :key="f.k" class="flex gap-1.5">
              <span class="text-ink-3">{{ f.k }}</span>
              <span class="text-ink-2" v-html="inline(f.v)" />
            </span>
          </p>
        </header>

        <p v-if="active && !brief" class="text-[13px] leading-[20px] text-ink-2">
          这家还没录岗位职责。
          <button class="text-ink underline decoration-line underline-offset-4" @click="emit('go', 'companies')">
            补公司资料
          </button>
        </p>

        <section v-if="brief?.what.length">
          <h3 class="mb-2 text-[13px] font-semibold text-ink">公司是做什么的</h3>
          <Blocks :blocks="brief.what" mid-prefix="brief-what" size="sm" />
        </section>

        <section v-if="brief?.duties.length">
          <h3 class="mb-2 text-[13px] font-semibold text-ink">岗位职责</h3>
          <Blocks :blocks="brief.duties" mid-prefix="brief-duty" size="sm" />
        </section>

        <section v-if="brief?.requirements.length">
          <button class="flex w-full items-center gap-1.5 text-left" @click="openReq = !openReq">
            <h3 class="text-[13px] font-semibold text-ink">任职要求</h3>
            <PhCaretRight
              :size="11"
              weight="bold"
              class="text-ink-3 transition-transform"
              :class="openReq ? 'rotate-90' : ''"
            />
          </button>
          <div v-if="openReq" class="mt-2">
            <Blocks :blocks="brief.requirements" mid-prefix="brief-req" size="sm" />
          </div>
        </section>

        <section v-if="brief?.gaps.length">
          <h3 class="mb-1 text-[13px] font-semibold text-ink">会被追着问的</h3>
          <div
            v-for="(g, i) in brief.gaps"
            :key="i"
            class="flex flex-col gap-0.5 border-b border-line py-2 last:border-b-0"
          >
            <p class="flex items-baseline gap-2 text-[13px] leading-[20px] text-ink">
              <span class="shrink-0 font-mono text-[11px]" :class="GAP_TONE[g.cover] || 'text-ink-3'">{{ g.cover }}</span>
              <span class="min-w-0" v-html="inline(g.need)" />
            </p>
            <p v-if="g.ask" class="pl-[34px] text-[12px] leading-[18px] text-ink-3" v-html="inline(g.ask)" />
          </div>
        </section>

        <section v-if="brief?.todo.length">
          <h3 class="mb-1 text-[13px] font-semibold text-ink">面试前要做完</h3>
          <ul class="flex flex-col">
            <li
              v-for="(x, xi) in brief.todo"
              :key="xi"
              class="flex items-start gap-2 border-b border-line py-2 text-[13px] leading-[20px] text-ink-2 last:border-b-0"
            >
              <span class="mt-1.5 h-2 w-2 shrink-0 rounded-[2px] border border-ink-3" />
              <span class="min-w-0" v-html="inline(x)" />
            </li>
          </ul>
        </section>

        <section v-if="materials.length">
          <h3 class="mb-1 text-[13px] font-semibold text-ink">职责对到的技术</h3>
          <button
            v-for="m in materials"
            :key="m.id"
            class="row group py-1.5 text-[13px]"
            @click="emit('go', m.id)"
          >
            <span class="min-w-0 flex-1 truncate text-ink">{{ m.label }}</span>
            <span class="shrink-0 text-[11px] text-ink-3">{{ m.count }} 篇</span>
            <PhArrowRight :size="11" weight="bold" class="shrink-0 text-ink-3 opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        </section>

        <section v-if="active.evidenceIds.length">
          <h3 class="mb-1 text-[13px] font-semibold text-ink">能拿出来讲的</h3>
          <button
            v-for="id in active.evidenceIds"
            :key="id"
            class="row group py-1.5 text-[13px]"
            @click="emit('go', 'evidence')"
          >
            <span class="min-w-0 flex-1 truncate text-ink">{{ evidenceById(id)?.title || id }}</span>
            <PhArrowRight :size="11" weight="bold" class="shrink-0 text-ink-3 opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        </section>

        <section v-if="noteDocs.length">
          <p class="mb-1 text-[13px] font-semibold text-ink">准备笔记</p>
          <button v-for="d in noteDocs" :key="d.id" class="row group py-1.5 text-[13px]" @click="emit('go', d.id)">
            <span class="min-w-0 flex-1 truncate text-ink">{{ d.label }}</span>
            <PhArrowRight :size="11" weight="bold" class="shrink-0 text-ink-3 opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        </section>
      </main>
    </div>
  </div>
</template>
