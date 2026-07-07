export const TADA_REVEAL_STAGES = ["budget", "goal", "feasibility", "todayRemaining"] as const

export type TadaRevealStage = (typeof TADA_REVEAL_STAGES)[number]
