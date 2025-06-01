import { LocalDate } from '@js-joda/core'
import type { PuzzleStat } from '@/types'

export const hydrate = (stats: { date: string; time: number }[]): PuzzleStat[] => {
  return stats
    ? stats.map(stat => ({
        date: LocalDate.parse(stat.date),
        time: stat.time,
      }))
    : []
}
