/**
 * 无数据依赖的共享层：块类型 + 行内渲染。
 * 演示产物只 import 这里，不 import store.ts —— 否则全量私有 JSON 会被打进包。
 */

export type Block =
  | { type: 'para'; text: string }
  | { type: 'h'; level: number; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'table'; head: string[]; rows: Record<string, string>[] }
  | { type: 'quote'; lines: string[] }
  | { type: 'code'; lang: string; text: string }
  | { type: 'mermaid'; lang: string; text: string }

export interface Chunk {
  name: string
  blocks: Block[]
}

export interface Diagram {
  id: string
  name: string
  code: string
}

/**
 * md 行内标记 → 安全 HTML（先转义再放行 ** 与 `）。
 * 全站唯一的富文本出口，别在视图里另写一套。
 */
export function inline(text: string): string {
  return (text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-ink">$1</strong>')
    .replace(
      /`([^`]+)`/g,
      '<code class="rounded-[3px] bg-white/10 px-1 py-px font-mono text-[0.9em] text-ink">$1</code>',
    )
}
