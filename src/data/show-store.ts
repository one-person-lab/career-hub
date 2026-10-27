import raw from './generated.show.json'
import type { Chunk, Diagram } from './types'

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
  diagrams: Diagram[]
  chunks: Chunk[]
}

const r = raw as Record<string, unknown>
export const showCards: ShowCard[] = (r.cards as ShowCard[]) ?? []
export const showGeneratedAt: string = (r.generatedAt as string) ?? ''
