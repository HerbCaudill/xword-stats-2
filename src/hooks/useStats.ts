import { useState, useEffect } from 'react'
import { LocalDate } from '@js-joda/core'
import { hydrate } from './hydrate'
import type { PuzzleStat } from '@/types'
import persistedStats from '@/data/puzzleStats.json'

const beginningOfTime = LocalDate.parse('2017-07-01')

export const usePuzzleStats = () => {
  const getInitialStats = () => {
    const cachedStatsString = localStorage.getItem('puzzleStats')
    if (cachedStatsString) {
      return hydrate(JSON.parse(cachedStatsString))
    }
    return hydrate(persistedStats)
  }

  const [stats, setStats] = useState<PuzzleStat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        const initialStats = getInitialStats()

        const mostRecentDate = initialStats.reduce(
          (latest, stat) => (stat.date.isAfter(latest) ? stat.date : latest),
          beginningOfTime
        )

        // If we have cached data and the most recent date is today, no need to fetch
        const today = LocalDate.now()
        if (mostRecentDate && mostRecentDate.isEqual(today)) {
          console.log('Using cached stats, no need to fetch new data')
          setStats(initialStats)
          setLoading(false)
          return
        }

        const nextDate = mostRecentDate.plusDays(1).toString()
        // Fetch new data from the API
        console.log(`Fetching stats for date: ${nextDate}`)
        const response = await fetch(`/api/stats/${nextDate}`)
        if (!response.ok) throw new Error(`API returned ${response.status}: ${await response.text()}`)

        const newStats = await response.json()

        // Combine cached stats with new stats
        const combinedStats = [...initialStats, ...hydrate(newStats)]

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
