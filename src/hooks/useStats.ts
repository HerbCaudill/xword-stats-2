import _persistedStats from '@/data/persistedStats.json'
import { hydrate } from '@/lib/hydrate'
import { mergeStats } from '@/lib/mergeStats'
import type { PuzzleStat } from '@/types'
import { LocalDate } from '@js-joda/core'
import { useEffect, useState } from 'react'
import { beginningOfTime } from '@/constants'
import { removeOutliers } from '@/lib/removeOutliers'
const persistedStats = hydrate(_persistedStats)

const storageKey = 'puzzleStats.v2'

export const usePuzzleStats = () => {
  const [stats, setStats] = useState<PuzzleStat[]>(persistedStats)

  useEffect(() => {
    async function fetchData() {
      const getInitialStats = () => {
        const cachedStatsString = localStorage.getItem(storageKey)
        if (cachedStatsString) {
          return hydrate(JSON.parse(cachedStatsString))
        }
        return persistedStats
      }

      const currentStats = getInitialStats()
      setStats(currentStats)

      const mostRecentDate = currentStats.reduce(
        (latest, stat) => (stat.date.isAfter(latest) ? stat.date : latest),
        beginningOfTime
      )

      // If we have cached data and the most recent date is today, no need to fetch
      const today = LocalDate.now()
      if (mostRecentDate && mostRecentDate.isEqual(today)) {
        console.log('Cached stats are up-to-date, no fetch needed.')
        return
      }

      // Fetch new data from the API
      console.log(`Fetching stats for date: ${mostRecentDate}`)
      const response = await fetch(`/api/stats/${mostRecentDate}`)
      if (!response.ok) throw new Error(`API returned ${response.status}: ${await response.text()}`)

      const newStats = hydrate(await response.json())

      const mergedStats = mergeStats(currentStats, newStats)

      // Update state and cache
      setStats(mergedStats)
      localStorage.setItem(storageKey, JSON.stringify(mergedStats))
    }

    fetchData()
  }, [])

  return { stats: removeOutliers(stats) }
}
