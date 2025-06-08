import { LocalDate } from '@js-joda/core'
import type { PuzzleStat } from '@/types'

export type EncodedPuzzleStat = {
  id: number
  date: string
  dateSolved: string
  time: number
}

export const hydrate = (stats: EncodedPuzzleStat[] = []): PuzzleStat[] =>
  stats.map(({ id, date, dateSolved, time }) => ({
    id,
    date: LocalDate.parse(date),
    dateSolved: LocalDate.parse(dateSolved),
    time,
  }))
