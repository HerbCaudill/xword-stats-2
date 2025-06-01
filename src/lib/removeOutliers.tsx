'use client'
import type { PuzzleStat } from '@/types'

// Remove outliers by day of the week using IQR method
export const removeOutliers = (data: PuzzleStat[]) => {
  const statsByDay: { [key: number]: PuzzleStat[] } = {}

  // Group stats by day of week
  data.forEach(stat => {
    const day = stat.date.dayOfWeek().value()
    if (!statsByDay[day]) statsByDay[day] = []
    statsByDay[day].push(stat)
  })

  const filteredStats: PuzzleStat[] = []

  // Remove outliers for each day
  Object.entries(statsByDay).forEach(([day, dayStats]) => {
    const times = dayStats.map(s => s.time).sort((a, b) => a - b)
    const q1Index = Math.floor(times.length * 0.25)
    const q3Index = Math.floor(times.length * 0.75)
    const q1 = times[q1Index]
    const q3 = times[q3Index]
    const iqr = q3 - q1
    const upperBound = q3 + 1.5 * iqr

    // Only remove upper outliers (longest times)
    const filtered = dayStats.filter(stat => stat.time <= upperBound)
    filteredStats.push(...filtered)
  })

  return filteredStats
}
