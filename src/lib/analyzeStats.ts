import type { LocalDate } from '@js-joda/core'
import { dayNames } from '../constants'
import type { PuzzleStat } from '../types'

export const analyzeStats = (stats: PuzzleStat[]) => {
  console.time('analyzeStats')
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

  const summary = summarizeStats(stats)
  console.timeEnd('analyzeStats')

  return {
    ...summary,
    byDayOfWeek,
    maxTime,
    minDate,
    maxDate,
    years,
    trailingAverages,
    trailingAveragesByDay,
  }
}

const summarizeStats = (stats: PuzzleStat[]): StatsSummary => {
  return {
    total: total(stats),
    average: average(stats),
    best: best(stats),
    latest: latest(stats),
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

const best = (stats: PuzzleStat[]) => {
  if (stats.length === 0) return undefined
  return stats.reduce((min, stat) => (stat.time < min.time ? stat : min), stats[0])
}

const latest = (stats: PuzzleStat[]) => {
  if (stats.length === 0) return undefined
  return stats.reduce((max, stat) => (stat.dateSolved.isAfter(max.dateSolved) ? stat : max), stats[0])
}

const calculateTrailingAverages = (stats: PuzzleStat[], minDate: LocalDate, maxDate: LocalDate, dayOfWeek?: number) => {
  const trailingAverages: Array<{ date: LocalDate; average: number }> = []

  // Filter and sort stats once
  const filteredStats = stats
    .filter(stat => {
      const matchesDayOfWeek = dayOfWeek === undefined || stat.date.dayOfWeek().value() === dayOfWeek
      const withinDateRange = !stat.dateSolved.isBefore(minDate.minusYears(3)) && !stat.dateSolved.isAfter(maxDate)
      return matchesDayOfWeek && withinDateRange
    })
    .sort((a, b) => (a.dateSolved.isBefore(b.dateSolved) ? -1 : 1))

  if (filteredStats.length === 0) return trailingAverages

  // Process each unique date where we have data
  let runningSum = 0
  let runningCount = 0
  let currentIndex = 0

  for (const stat of filteredStats) {
    const statDate = stat.dateSolved

    // Skip if this date is before our analysis range
    if (statDate.isBefore(minDate)) continue

    // Remove stats older than 3 years from running totals
    const threeYearsAgo = statDate.minusYears(3)
    while (currentIndex < filteredStats.length && filteredStats[currentIndex].dateSolved.isBefore(threeYearsAgo)) {
      runningSum -= filteredStats[currentIndex].time
      runningCount--
      currentIndex++
    }

    // Add current stat to running totals
    runningSum += stat.time
    runningCount++

    // Calculate and store the average for this date
    if (runningCount > 0) {
      trailingAverages.push({
        date: statDate,
        average: Math.round(runningSum / runningCount),
      })
    }
  }

  return trailingAverages
}

type StatsSummary = {
  total: number
  average?: number
  best?: PuzzleStat
  latest?: PuzzleStat
  stats: PuzzleStat[]
}
