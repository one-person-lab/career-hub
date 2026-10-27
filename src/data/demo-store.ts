import raw from './generated.demo.json'
import type { Chunk, Diagram } from './types'

/** 演示卡：只含讲解要用的字段，形状由 scripts/build-data.mjs 的 toDemoCard 决定 */
export interface DemoCard {
  id: string
  title: string
  oneLine: string
  type: string
  period: string
  role: string
  scale: string
  demoLink: string
  impact: Record<string, string>[]
  impactHead: string[]
  diagrams: Diagram[]
  chunks: Chunk[]
}

const r = raw as Record<string, unknown>
export const demoCards: DemoCard[] = (r.cards as DemoCard[]) ?? []
export const demoGeneratedAt: string = (r.generatedAt as string) ?? ''
