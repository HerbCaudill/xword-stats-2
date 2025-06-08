'use client'

import { dayNames } from '@/constants'
import cx from 'classnames'
import { getColor } from './getColor'

export function DayLegend({ selectedDay, onDaySelect }: Props) {
  return (
    <div className="flex flex-wrap gap-1 p-2">
      {Object.entries(dayNames).map(([dayNum, dayName]) => (
        <div
          key={dayNum}
          className={cx(`flex items-center gap-1 cursor-pointer p-1 rounded hover:bg-gray-100 border`, {
            'border-white': selectedDay !== Number(dayNum),
            'border-gray-300': selectedDay === Number(dayNum),
          })}
          onClick={() => {
            if (selectedDay === Number(dayNum)) onDaySelect(null)
            else onDaySelect(Number(dayNum))
          }}
        >
          <div
            className="w-3 h-3 rounded-full"
            style={{
              backgroundColor: selectedDay === null || selectedDay === Number(dayNum) ? getColor(dayNum) : '#cccccc',
            }}
          />
          <span className="text-xs">{dayName}</span>
        </div>
      ))}
    </div>
  )
}

type Props = {
  selectedDay: number | null
  onDaySelect: (day: number | null) => void
}
