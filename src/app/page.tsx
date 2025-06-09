'use client'

import { DayLegend, PuzzleChart } from '@/components'
import { useDayNavigation } from '@/hooks/useDayNavigation'
import { usePuzzleStats } from '@/hooks/useStats'
import { useDrag } from '@use-gesture/react'
import { useState } from 'react'

export default function HistoryPage() {
  const { stats } = usePuzzleStats()
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const { navigateToNextDay, navigateToPreviousDay } = useDayNavigation(selectedDay, setSelectedDay)

  const bind = useDrag(
    ({ swipe: [swipeX] }) => {
      if (swipeX === -1) {
        // Swipe left - go to previous day
        navigateToPreviousDay()
      } else if (swipeX === 1) {
        // Swipe right - go to next day
        navigateToNextDay()
      }
    },
    {
      swipe: {
        distance: 50, // Minimum distance for swipe detection
        velocity: 0.5, // Minimum velocity for swipe detection
      },
    }
  )

  return (
    <div {...bind()} className="flex flex-col h-screen w-full gap-2 max-w-xl touch-pan-y">
      <DayLegend selectedDay={selectedDay} onDaySelect={setSelectedDay} />
      <PuzzleChart stats={stats} selectedDay={selectedDay} />
    </div>
  )
}
