import { useState, useEffect } from 'react'
import { LocalDate } from '@js-joda/core'
import { hydrate } from './hydrate'
import type { PuzzleStat } from '../types'

const beginningOfTime = LocalDate.parse('2017-07-01')

export const usePuzzleStats = () => {
  const [stats, setStats] = useState<PuzzleStat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        // Try to get stats from localStorage
        const cachedStatsString = localStorage.getItem('puzzleStats')
        let cachedStats: PuzzleStat[] = []
        let mostRecentDate: LocalDate = beginningOfTime

        if (cachedStatsString) {
          cachedStats = hydrate(JSON.parse(cachedStatsString))
          setStats(cachedStats)

          // Find the most recent date in cached stats
          if (cachedStats.length > 0) {
            // Sort by date descending to get the most recent
            const sortedDates = [...cachedStats].sort((a, b) => b.date.compareTo(a.date))
            mostRecentDate = sortedDates[0].date
          }
        }

        // If we have cached data and the most recent date is today, no need to fetch
        const today = LocalDate.now()
        if (mostRecentDate && mostRecentDate.isEqual(today)) {
          console.log('Using cached stats, no need to fetch new data')
          setLoading(false)
          return
        }

        const nextDate = mostRecentDate.plusDays(1).toString()
        // Fetch new data from the API
        const response = await fetch(`/api/stats/${nextDate}`)
        if (!response.ok) throw new Error(`API returned ${response.status}: ${await response.text()}`)

        const newStats = await response.json()

        // Combine cached stats with new stats
        const combinedStats = [...cachedStats, ...hydrate(newStats)]

        // Remove any duplicates by date
        const uniqueStats = combinedStats.reduce((acc: PuzzleStat[], curr) => {
          if (!acc.some(stat => stat.date.equals(curr.date))) acc.push(curr)
          return acc
        }, [])

        // Sort by date
        uniqueStats.sort((a, b) => a.date.compareTo(b.date))

        // Update state and cache
        setStats(uniqueStats)
        localStorage.setItem('puzzleStats', JSON.stringify(uniqueStats))
      } catch (error) {
        console.error('Error fetching data:', error)
        setError(error instanceof Error ? error.message : 'An unknown error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return {
    stats,
    loading,
    error,
  }
}
