'use client'

import { usePuzzleStats } from '@/hooks/useStats'
import { LocalDate } from '@js-joda/core'
import { useRef, useState } from 'react'
import colors from 'tailwindcss/colors'
import cx from 'classnames'
import { removeOutliers } from '../lib/removeOutliers'

const color = {
  axis: colors.gray[300],
  gridLines: colors.gray[300],
  text: colors.gray[600],
}

const dayColors = {
  1: colors.red[600], // Monday
  2: colors.orange[600], // Tuesday
  3: colors.yellow[600], // Wednesday
  4: colors.green[600], // Thursday
  5: colors.blue[600], // Friday
  6: colors.violet[600], // Saturday
  7: colors.pink[600], // Sunday
}

const getColor = (dayOfWeek: string | number) => {
  return dayColors[Number(dayOfWeek) as keyof typeof dayColors] || colors.gray[400] // Default color if not found
}

const dayNames = {
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
  7: 'Sun',
}

const chartHeight = 400
const chartWidth = 800 // Fixed internal width
const padding = { top: 0, right: 10, bottom: 40, left: 40 }
const minTimeForScale = 180

export default function HistoryPage() {
  const { stats, loading, error } = usePuzzleStats()
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; date: LocalDate; time: number } | null>(null)

  const filteredStats = removeOutliers(stats)

  const getPointColor = (dayOfWeek: number) => {
    if (selectedDay === null || selectedDay === dayOfWeek) {
      return getColor(dayOfWeek)
    }
    return '#cccccc' // Gray out unselected days
  }

  const getPointRadius = (dayOfWeek: number, isHovered: boolean = false) => {
    const baseRadius = selectedDay !== null && selectedDay === dayOfWeek ? 3 : 2
    return isHovered ? baseRadius * 2 : baseRadius
  }

  if (loading) return <div className="container mx-auto p-4">Loading...</div>

  if (error) return <div className="container mx-auto p-4 text-red-500">Error loading data: {error}</div>

  // Chart dimensions and padding
  const plotWidth = chartWidth - padding.left - padding.right
  const plotHeight = chartHeight - padding.top - padding.bottom

  // Get data ranges
  const dates = filteredStats.map(stat => stat.date)
  const times = filteredStats.map(stat => stat.time)

  const minYear = Math.min(...dates.map(d => d.year()))
  const maxYear = Math.max(...dates.map(d => d.year()))

  const minDate = LocalDate.of(minYear, 1, 1).toEpochDay()
  const maxDate = LocalDate.of(maxYear, 12, 31).toEpochDay()
  const maxTimeForScale = Math.max(...times)

  const logMin = Math.log(minTimeForScale)
  const logMax = Math.log(maxTimeForScale)

  // Scale functions
  const scaleX = (date: LocalDate) => ((date.toEpochDay() - minDate) / (maxDate - minDate)) * plotWidth

  const scaleY = (time: number) => plotHeight - ((Math.log(time) - logMin) / (logMax - logMin)) * plotHeight

  // Generate tick marks
  // X-axis: Years
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i)

  // Filter stats based on selected day
  const dayFilteredStats =
    selectedDay === null ? filteredStats : filteredStats.filter(stat => stat.date.dayOfWeek().value() === selectedDay)

  const xTickPositions = years.map(year => {
    const yearStart = LocalDate.of(year, 1, 1)
    const yearStats = dayFilteredStats.filter(stat => stat.date.year() === year)
    const yearCount = yearStats.length
    const yearAvgTime = yearCount > 0 ? Math.round(yearStats.reduce((sum, stat) => sum + stat.time, 0) / yearCount) : 0

    return {
      x: scaleX(yearStart),
      year: year,
      count: yearCount,
      avgTime: yearAvgTime,
    }
  })

  // Y-axis: Logarithmic scale with nice round numbers
  // Generate logarithmic tick marks (1, 2, 5, 10, 20, 50 minutes, etc.)
  const logTickValues = []
  const baseValues = [1, 2, 5]
  for (let power = 0; power <= 4; power++) {
    for (const base of baseValues) {
      const value = base * Math.pow(10, power) * 60 // Convert to seconds
      if (value >= minTimeForScale && value <= maxTimeForScale) {
        logTickValues.push(value)
      }
    }
  }

  const yTickPositions = logTickValues.map(time => ({
    y: plotHeight - ((Math.log(time) - logMin) / (logMax - logMin)) * plotHeight,
    time: time,
  }))

  return (
    <div ref={containerRef} className="">
      <div className="mb-6">
        {/* Legend */}
        <div className="flex flex-wrap gap-1 p-2">
          {Object.entries(dayNames).map(([dayNum, dayName]) => (
            <div
              key={dayNum}
              className={cx(`flex items-center gap-1 cursor-pointer p-1 rounded hover:bg-gray-100 border`, {
                'border-white': selectedDay !== Number(dayNum),
                'border-gray-300': selectedDay === Number(dayNum),
              })}
              onClick={() => {
                if (selectedDay === Number(dayNum)) setSelectedDay(null)
                else setSelectedDay(Number(dayNum))
              }}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor:
                    selectedDay === null || selectedDay === Number(dayNum) ? getColor(dayNum) : '#cccccc',
                }}
              />
              <span className="text-xs">{dayName}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="relative">
        <svg
          width="100%"
          height="auto"
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Grid lines */}
          <g>
            {/* Vertical grid lines */}
            {xTickPositions.map((tick, i) => (
              <line
                key={`x-grid-${i}`}
                x1={padding.left + tick.x}
                y1={padding.top}
                x2={padding.left + tick.x}
                y2={padding.top + plotHeight}
                stroke={color.axis}
                strokeWidth={1}
              />
            ))}

            {/* Horizontal grid lines */}
            {yTickPositions.map((tick, i) => (
              <line
                key={`y-grid-${i}`}
                x1={padding.left}
                y1={padding.top + tick.y}
                x2={padding.left + plotWidth}
                y2={padding.top + tick.y}
                stroke={color.gridLines}
                strokeWidth={1}
              />
            ))}
          </g>

          {/* Data points */}
          <g>
            {filteredStats
              .sort((a, b) => {
                const aIsSelected = selectedDay === null || selectedDay === a.date.dayOfWeek().value()
                const bIsSelected = selectedDay === null || selectedDay === b.date.dayOfWeek().value()
                // Sort unselected items first (false < true), selected items last
                return Number(aIsSelected) - Number(bIsSelected)
              })
              .map((stat, i) => {
                const isHovered = Boolean(tooltip && tooltip.date.equals(stat.date) && tooltip.time === stat.time)
                return (
                  <circle
                    key={i}
                    cx={padding.left + scaleX(stat.date)}
                    cy={padding.top + scaleY(stat.time)}
                    r={getPointRadius(stat.date.dayOfWeek().value(), isHovered)}
                    fill={getPointColor(stat.date.dayOfWeek().value())}
                    stroke="transparent"
                    strokeWidth={3}
                    style={{
                      cursor: 'pointer',
                      pointerEvents: 'all',
                      zIndex: isHovered ? 1000 : 'auto',
                    }}
                    onPointerEnter={e => {
                      if (selectedDay === null || selectedDay === stat.date.dayOfWeek().value()) {
                        setTooltip({
                          x: padding.left + scaleX(stat.date),
                          y: padding.top + scaleY(stat.time),
                          date: stat.date,
                          time: stat.time,
                        })
                      }
                    }}
                    onPointerLeave={() => {
                      setTooltip(null)
                    }}
                  />
                )
              })}
          </g>

          {/* Average time lines for each year */}
          <g>
            {xTickPositions.map((tick, i) => {
              if (tick.count === 0) return null

              const nextTick = xTickPositions[i + 1]
              const lineStartX = tick.x
              const lineEndX = nextTick ? nextTick.x : plotWidth
              const lineY = scaleY(tick.avgTime)
              const lineColor = selectedDay === null ? colors.gray['800'] : getColor(selectedDay)

              return (
                <g key={`avg-group-${i}-${selectedDay || 'all'}`}>
                  {/* Translucent box from average line to x-axis */}
                  <rect
                    x={padding.left + lineStartX}
                    y={padding.top + lineY}
                    width={lineEndX - lineStartX}
                    height={plotHeight - lineY}
                    fill={lineColor}
                    opacity={0.1}
                    style={{ pointerEvents: 'none' }}
                  />
                  {/* Average line */}
                  <line
                    x1={padding.left + lineStartX}
                    y1={padding.top + lineY}
                    x2={padding.left + lineEndX}
                    y2={padding.top + lineY}
                    stroke={lineColor}
                    strokeWidth={1}
                    style={{ pointerEvents: 'none' }}
                  />
                </g>
              )
            })}
          </g>

          {/* X-axis */}
          <line
            x1={padding.left}
            y1={padding.top + plotHeight}
            x2={padding.left + plotWidth}
            y2={padding.top + plotHeight}
            stroke={color.axis}
            strokeWidth={1}
          />

          {/* Y-axis */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={padding.top + plotHeight}
            stroke={color.axis}
            strokeWidth={1}
          />

          {/* Y-axis labels */}
          <g>
            {yTickPositions.map((tick, i) => (
              <g key={`y-label-${i}`}>
                {tick.time > 0 ? (
                  <text
                    x={padding.left - 10}
                    y={padding.top + tick.y + 4}
                    textAnchor="end"
                    fontSize="12"
                    fill="#374151"
                  >
                    {tick.time / 60}
                  </text>
                ) : null}
              </g>
            ))}
          </g>

          {/* X-axis labels */}
          <g>
            {xTickPositions.map((tick, i) => (
              <foreignObject
                key={`x-label-${i}-${selectedDay || 'all'}`}
                x={padding.left + tick.x - 25}
                y={padding.top + plotHeight + 5}
                width="50"
                height="35"
              >
                <div className="flex flex-col items-center">
                  <div className="font-bold text-xs text-gray-800">{tick.year}</div>
                  {tick.count > 0 ? (
                    <div className="text-gray-500 text-2xs">
                      {Math.floor(tick.avgTime / 60)}:{(tick.avgTime % 60).toString().padStart(2, '0')}
                    </div>
                  ) : null}
                </div>
              </foreignObject>
            ))}
          </g>
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none z-10"
            style={{
              left: `${(tooltip.x / chartWidth) * 100}%`,
              top: `${((tooltip.y - 10) / chartHeight) * 100}%`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div>{tooltip.date.toString()}</div>
            <div>
              {Math.floor(tooltip.time / 60)}:{(tooltip.time % 60).toString().padStart(2, '0')}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
