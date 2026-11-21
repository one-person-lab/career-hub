import raw from './generated.show.json'
import type { Block } from './types'

/** 一章：一个 H2 段，图单独出来好放大居中讲 */
export interface ShowChapter {
  name: string
  blocks: Block[]
  diagrams: string[]
}

/** 演示卡：只含讲解要用的字段，形状由 scripts/build-data.mjs 的 toShowCard 决定 */
export interface ShowCard {
  id: string
  title: string
  oneLine: string
  type: string
  period: string
  role: string
  scale: string
  showLink: string
  impact: Record<string, string>[]
  impactHead: string[]
  /** 「讲解提纲」段的条目，右侧提词面板用 */
  outline: string[]
  chapters: ShowChapter[]
}

const r = raw as Record<string, unknown>
export const showCards: ShowCard[] = (r.cards as ShowCard[]) ?? []
export const showGeneratedAt: string = (r.generatedAt as string) ?? ''
