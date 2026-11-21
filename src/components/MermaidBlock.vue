<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'

const props = defineProps<{ code: string; id: string; /** 演示投屏：去掉卡片外壳，图占满宽度放大 */ fit?: boolean }>()

const el = ref<HTMLElement | null>(null)
const error = ref('')
const rendering = ref(false)

// mermaid 体积很大（内部带 cytoscape/katex），改成动态 import：
// 只有用户真的展开流程图时才下载对应 chunk，主包不受影响。
type MermaidApi = {
  initialize: (cfg: Record<string, unknown>) => void
  render: (id: string, code: string) => Promise<{ svg: string }>
}
let mermaid: MermaidApi | null = null

async function load(): Promise<MermaidApi> {
  if (mermaid) return mermaid
  const mod = (await import('mermaid')) as unknown as { default: MermaidApi }
  mermaid = mod.default
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'base',
    fontFamily: "'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif",
    themeVariables: {
      background: 'transparent',
      primaryColor: '#191a1c',
      primaryTextColor: 'rgba(255,255,255,.87)',
      primaryBorderColor: 'rgba(255,255,255,.16)',
      lineColor: '#6b7280',
      secondaryColor: 'rgba(94,106,210,.22)',
      tertiaryColor: 'rgba(76,183,130,.18)',
      noteBkgColor: '#16171a',
      noteTextColor: 'rgba(255,255,255,.87)',
      fontSize: '13px',
    },
  })
  return mermaid
}

async function render() {
  if (!el.value) return
  error.value = ''
  rendering.value = true
  try {
    const api = await load()
    const { svg } = await api.render(`m-${props.id}-${Date.now()}`, props.code)
    if (!el.value) return // 渲染期间组件已被卸载（切页、筛选）
    el.value.innerHTML = svg
    // 投屏用：mermaid 给 svg 写死了 max-width，只能渲染完再改它的 style。
    // 宽度撑满、高度按 viewBox 等比走，再用 max-height 收进一屏 —— 等效 contain。
    if (props.fit) {
      const node = el.value.querySelector('svg')
      if (node) {
        node.style.width = '100%'
        node.style.maxWidth = '100%'
        node.style.height = 'auto'
        node.style.maxHeight = '62vh'
      }
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
    el.value.innerHTML = ''
  } finally {
    rendering.value = false
  }
}

onMounted(render)
watch(() => props.code, render)
</script>

<template>
  <div :class="props.fit ? 'w-full' : 'overflow-x-auto rounded-md border border-line bg-base p-3'">
    <p v-if="rendering" class="py-6 text-center text-xs font-bold text-neutral-400">正在渲染流程图…</p>
    <div ref="el" class="md-body flex justify-center" :class="props.fit ? 'w-full' : ''" />
    <p v-if="error" class="mt-2 text-xs font-bold text-neutral-500">该 mermaid 图无法渲染：{{ error }}</p>
  </div>
</template>
