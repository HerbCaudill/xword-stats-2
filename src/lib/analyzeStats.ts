import { dayNames } from '../constants'
import type { PuzzleStat } from '../types'

export const analyzeStats = (stats: PuzzleStat[]) => {
  const byDayOfWeek = Object.keys(dayNames).reduce((acc, i) => {
    const filteredStats = stats.filter(stat => stat.date.dayOfWeek().value() === Number(i))
    acc[i] = summarizeStats(filteredStats)
    return acc
  }, {} as Record<string, StatsSummary>)

  const maxTime = Math.max(...stats.map(stat => stat.time))
  const minDate = stats
    .reduce((min, stat) => (stat.dateSolved.isBefore(min.dateSolved) ? stat : min))
    .dateSolved.withDayOfYear(1) // first day of year
  const maxDate = stats
    .reduce((max, stat) => (stat.dateSolved.isAfter(max.dateSolved) ? stat : max))
    .dateSolved.plusYears(1)
    .withDayOfYear(1)
    .minusDays(1) // last day of year

  const years = Array.from({ length: maxDate.year() - minDate.year() + 1 }, (_, i) => minDate.year() + i)

  return {
    ...summarizeStats(stats),
    byDayOfWeek,
    maxTime,
    minDate,
    maxDate,
    years,
  }
}

const summarizeStats = (stats: PuzzleStat[]): StatsSummary => {
  return {
    total: total(stats),
    average: average(stats),
    best: bestTime(stats),
    mostRecent: mostRecent(stats),
    stats,
  }
}

const total = (stats: PuzzleStat[]) => {
  return stats.reduce((sum, stat) => sum + stat.time, 0)
}

const average = (stats: PuzzleStat[]) => {
  if (stats.length === 0) return undefined
  return Math.round(total(stats) / stats.length)
}

const bestTime = (stats: PuzzleStat[]) => {
  if (stats.length === 0) return undefined
  return stats.reduce((min, stat) => (stat.time < min.time ? stat : min), stats[0])
}

const mostRecent = (stats: PuzzleStat[]) => {
  if (stats.length === 0) return undefined
  return stats.reduce(
    (mostRecent, stat) => (stat.dateSolved.isAfter(mostRecent.dateSolved) ? stat : mostRecent),
    stats[0]
  )
}

type StatsSummary = {
  total: number
  average?: number
  best?: PuzzleStat
  mostRecent?: PuzzleStat
  stats: PuzzleStat[]
}
