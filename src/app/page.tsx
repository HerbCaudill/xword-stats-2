'use client'

import { DayLegend, PuzzleChart } from '@/components'
import { usePuzzleStats } from '@/hooks/useStats'
import { useState } from 'react'

export default function HistoryPage() {
  const { stats } = usePuzzleStats()
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  return (
    <div className="flex flex-col h-screen w-full gap-2 max-w-xl ">
      <DayLegend selectedDay={selectedDay} onDaySelect={setSelectedDay} />
      <PuzzleChart stats={stats} selectedDay={selectedDay} />
    </div>
  )
}
