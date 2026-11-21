<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { PhCheck, PhEye, PhEyeSlash, PhMagnifyingGlass, PhShuffle } from '@phosphor-icons/vue'
import { warrooms, type WarQuestion } from '../data/store'
import Blocks from '../components/Blocks.vue'

/**
 * 岗位作战室：一个岗位一整套模拟问答。
 * 用法是「盖住答案自己讲一遍，再对参考答法」——所以掌握状态、抽题、遮答案都在首屏。
 */
const room = warrooms[0]
const LEVELS = ['基础', '进阶', '压力'] as const

const query = ref('')
const level = ref('')
const hide = ref(false)
const mastered = ref<string[]>(loadMastered())
const revealed = ref<string[]>([])

function loadMastered(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem('war.mastered') || '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}
watch(mastered, (v) => localStorage.setItem('war.mastered', JSON.stringify(v)), { deep: true })

const hit = (q: WarQuestion): boolean => {
  const text = [q.q, ...q.asked, ...q.followups, JSON.stringify(q.answer)].join(' ')
  return text.toLowerCase().includes(query.value.trim().toLowerCase())
}

const groups = computed(() =>
  (room?.groups ?? [])
    .map((g) => ({ ...g, questions: g.questions.filter((q) => (!level.value || q.level === level.value) && hit(q)) }))
    .filter((g) => g.questions.length),
)
const shown = computed(() => groups.value.reduce((n, g) => n + g.questions.length, 0))
const done = computed(() => (room ? room.groups.flatMap((g) => g.questions).filter((q) => mastered.value.includes(q.id)).length : 0))

const isDone = (id: string): boolean => mastered.value.includes(id)
const toggleDone = (id: string): void => {
  mastered.value = isDone(id) ? mastered.value.filter((x) => x !== id) : [...mastered.value, id]
}
const isRevealed = (id: string): boolean => !hide.value || revealed.value.includes(id)
const reveal = (id: string): void => {
  revealed.value = [...revealed.value, id]
}

const jump = (code: string): void => {
  document.getElementById(`war-${code}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

/** 抽一道还没掌握的，滚过去、留出自己想的时间 */
function draw() {
  const pool = (room?.groups ?? []).flatMap((g) => g.questions).filter((q) => !isDone(q.id))
  if (!pool.length) return
  const q = pool[Math.floor(Math.random() * pool.length)]
  hide.value = true
  revealed.value = revealed.value.filter((id) => id !== q.id)
  setTimeout(() => {
    document.getElementById(`war-q-${q.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, 30)
}

/** 左侧目录跟着正文亮 */
const active = ref('')
let io: IntersectionObserver | undefined
const observe = (): void => {
  io?.disconnect()
  document.querySelectorAll('[data-war-group]').forEach((el) => io?.observe(el))
}
onMounted(() => {
  io = new IntersectionObserver(
    (entries) => {
      const top = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
      if (top) active.value = top.target.id.replace('war-', '')
    },
    { root: document.querySelector('main'), rootMargin: '-8% 0px -70% 0px' },
  )
  nextTick(observe)
})
watch([groups, hide], () => nextTick(observe))
watch(hide, () => (revealed.value = []))
onBeforeUnmount(() => io?.disconnect())
</script>

<template>
  <div v-if="room" class="mx-auto flex max-w-[1280px] flex-col gap-3">
    <div class="flex flex-wrap items-center gap-2">
      <div class="mr-auto flex items-baseline gap-2">
        <h2 class="text-[15px] font-semibold text-ink">{{ room.company }} · {{ room.role }}</h2>
        <span class="font-mono text-[11px] text-ink-3">{{ done }}/{{ room.total }}</span>
      </div>

      <label class="flex h-7 items-center gap-1.5 rounded-md border border-line bg-panel px-2">
        <PhMagnifyingGlass :size="12" weight="bold" class="text-ink-3" />
        <input
          v-model="query"
          class="w-[180px] bg-transparent text-[12px] text-ink outline-none placeholder:text-ink-3"
          placeholder="搜题目或关键词"
        />
      </label>

      <div class="tabs">
        <button class="tab" :class="!level ? 'tab-active' : ''" @click="level = ''">全部</button>
        <button v-for="l in LEVELS" :key="l" class="tab" :class="level === l ? 'tab-active' : ''" @click="level = l">
          {{ l }}
        </button>
      </div>

      <button class="btn" :class="hide ? 'btn-primary' : ''" @click="hide = !hide">
        <component :is="hide ? PhEyeSlash : PhEye" :size="13" weight="bold" />
        {{ hide ? '显示答案' : '遮住答案' }}
      </button>
      <button class="btn" @click="draw">
        <PhShuffle :size="13" weight="bold" />
        抽一题
      </button>
    </div>

    <div class="flex gap-3">
      <aside class="sticky top-0 h-fit max-h-[calc(100vh-120px)] w-[212px] shrink-0 self-start overflow-y-auto">
        <nav class="flex flex-col gap-0.5">
          <button
            v-for="g in groups"
            :key="g.code"
            class="row text-[12px]"
            :class="active === g.code ? 'row-active text-ink' : 'text-ink-2 hover:text-ink'"
            @click="jump(g.code)"
          >
                <span class="min-w-0 flex-1 truncate text-left">{{ g.title }}</span>
            <span class="font-mono text-[10px] text-ink-3">{{ g.questions.length }}</span>
          </button>
        </nav>
      </aside>

      <div class="flex min-w-0 max-w-[860px] flex-1 flex-col gap-6">
        <p v-if="!shown" class="panel text-[13px] text-ink-2">没有匹配的题目。</p>

        <section v-for="g in groups" :key="g.code" :id="`war-${g.code}`" data-war-group class="scroll-mt-2">
          <div class="mb-2 flex items-baseline gap-2">
            <h3 class="text-[13px] font-semibold text-ink">{{ g.title }}</h3>
          </div>

          <div class="flex flex-col gap-2">
            <article
              v-for="q in g.questions"
              :id="`war-q-${q.id}`"
              :key="q.id"
              class="panel scroll-mt-4"
              :class="isDone(q.id) ? 'opacity-70' : ''"
            >
              <header class="flex items-start gap-2">
                <div class="min-w-0 flex-1">
                  <h4 class="text-[13px] font-semibold leading-relaxed text-ink">{{ q.q }}</h4>
                  <div v-if="q.asked.length" class="mt-1 flex flex-col gap-1">
                    <p v-for="(a, i) in q.asked" :key="i" class="text-[12px] leading-relaxed text-ink-3">
                      “{{ a }}”
                    </p>
                  </div>
                </div>
                <span v-if="q.level" class="chip shrink-0">{{ q.level }}</span>
                <button
                  class="shrink-0 rounded p-1"
                  :class="isDone(q.id) ? 'text-brand' : 'text-ink-3 hover:text-ink'"
                  :title="isDone(q.id) ? '已掌握' : '标记已掌握'"
                  @click="toggleDone(q.id)"
                >
                  <PhCheck :size="14" weight="bold" />
                </button>
              </header>

              <div v-if="isRevealed(q.id)" class="mt-3 border-t border-line pt-3">
                <Blocks :blocks="q.answer" :mid-prefix="`war-a-${q.id}`" size="sm" />
                <div v-if="q.diagram.length" class="mt-3">
                  <Blocks :blocks="q.diagram" :mid-prefix="`war-d-${q.id}`" size="sm" />
                </div>
                <div v-if="q.followups.length" class="mt-3">
                  <div class="mb-1 text-[10px] font-semibold text-ink-3">可能追问</div>
                  <ul class="flex flex-col gap-1">
                    <li v-for="(f, i) in q.followups" :key="i" class="text-[12px] leading-relaxed text-ink-3">
                      {{ f }}
                    </li>
                  </ul>
                </div>
              </div>
              <button
                v-else
                class="mt-3 border-t border-line pt-2 text-[12px] text-ink-3 hover:text-ink"
                @click="reveal(q.id)"
              >
                自己讲一遍再对答案
              </button>
            </article>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
