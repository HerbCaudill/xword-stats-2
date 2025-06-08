import type { LocalDate } from '@js-joda/core'
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

  const trailingAverages = calculateTrailingAverages(stats, minDate, maxDate)

  const trailingAveragesByDay = Object.keys(dayNames).reduce((acc, i) => {
    acc[i] = calculateTrailingAverages(stats, minDate, maxDate, Number(i))
    return acc
  }, {} as Record<string, Array<{ date: any; average: number }>>)

  const streaks = identifyStreaks(stats)
  const trailingAveragesByStreak = streaks.map(streak => ({
    streakId: streak.id,
    startDate: streak.startDate,
    endDate: streak.endDate,
    trailingAverages: calculateTrailingAverages(streak.stats, streak.startDate, streak.endDate),
  }))

  const trailingAveragesByStreakAndDay = Object.keys(dayNames).reduce((acc, i) => {
    acc[i] = streaks.map(streak => ({
      streakId: streak.id,
      startDate: streak.startDate,
      endDate: streak.endDate,
      trailingAverages: calculateTrailingAverages(streak.stats, streak.startDate, streak.endDate, Number(i)),
    }))
    return acc
  }, {} as Record<string, Array<{ streakId: number; startDate: LocalDate; endDate: LocalDate; trailingAverages: Array<{ date: LocalDate; average: number }> }>>)

  return {
    ...summarizeStats(stats),
    byDayOfWeek,
    maxTime,
    minDate,
    maxDate,
    years,
    trailingAverages,
    trailingAveragesByDay,
    streaks,
    trailingAveragesByStreak,
    trailingAveragesByStreakAndDay,
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

const calculateTrailingAverages = (stats: PuzzleStat[], minDate: LocalDate, maxDate: LocalDate, dayOfWeek?: number) => {
  const trailingAverages: Array<{ date: LocalDate; average: number }> = []

  // Sort stats by date for efficient lookups
  const sortedStats = [...stats]
    .filter(stat => dayOfWeek === undefined || stat.date.dayOfWeek().value() === dayOfWeek)
    .sort((a, b) => (a.dateSolved.isBefore(b.dateSolved) ? -1 : 1))

  // Generate cumulative averages for each day in the range
  let currentDate = minDate

  while (currentDate.isBefore(maxDate) || currentDate.isEqual(maxDate)) {
    // Get all stats from the beginning up to current date
    const cumulativeStats = sortedStats.filter(
      stat => !stat.dateSolved.isAfter(currentDate) && stat.dateSolved.isAfter(currentDate.minusYears(3))
    )

    if (cumulativeStats.length > 0) {
      const avg = average(cumulativeStats)
      if (avg !== undefined) {
        trailingAverages.push({
          date: currentDate,
          average: avg,
        })
      }
    }

    currentDate = currentDate.plusDays(1)
  }

  return trailingAverages
}

const identifyStreaks = (
  stats: PuzzleStat[],
  maxGapDays: number = 14
): Array<{ id: number; startDate: LocalDate; endDate: LocalDate; stats: PuzzleStat[] }> => {
  if (stats.length === 0) return []

  // Sort stats by date
  const sortedStats = [...stats].sort((a, b) => a.dateSolved.compareTo(b.dateSolved))

  const streaks: Array<{ id: number; startDate: LocalDate; endDate: LocalDate; stats: PuzzleStat[] }> = []
  let currentStreak: PuzzleStat[] = [sortedStats[0]]
  let streakId = 0

  for (let i = 1; i < sortedStats.length; i++) {
    const currentStat = sortedStats[i]
    const previousStat = sortedStats[i - 1]

    // Calculate days between puzzles
    const daysBetween = previousStat.dateSolved.until(currentStat.dateSolved).days()

    if (daysBetween <= maxGapDays) {
      // Continue current streak
      currentStreak.push(currentStat)
    } else {
      // End current streak and start new one
      if (currentStreak.length > 10) {
        streaks.push({
          id: streakId++,
          startDate: currentStreak[0].dateSolved,
          endDate: currentStreak[currentStreak.length - 1].dateSolved,
          stats: currentStreak,
        })
      }
      currentStreak = [currentStat]
    }
  }

  // Don't forget the last streak
  if (currentStreak.length > 0) {
    streaks.push({
      id: streakId,
      startDate: currentStreak[0].dateSolved,
      endDate: currentStreak[currentStreak.length - 1].dateSolved,
      stats: currentStreak,
    })
  }

  return streaks
}

type StatsSummary = {
  total: number
  average?: number
  best?: PuzzleStat
  mostRecent?: PuzzleStat
  stats: PuzzleStat[]
}
