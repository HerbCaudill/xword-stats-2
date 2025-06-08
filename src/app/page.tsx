'use client'

import { dayNames } from '@/constants'
import { usePuzzleStats } from '@/hooks/useStats'
import { formatTime } from '@/lib/formatTime'
import { removeOutliers } from '@/lib/removeOutliers'
import { analyzeStats } from '@/lib/analyzeStats'
import type { PuzzleStat } from '@/types'
import { DayOfWeek, LocalDate, TemporalAdjusters } from '@js-joda/core'
import cx from 'classnames'
import { useRef, useState } from 'react'
import colors from 'tailwindcss/colors'

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

const getColor = (dayOfWeek: string | number) =>
  dayColors[Number(dayOfWeek) as keyof typeof dayColors] || colors.gray[400]

const chartHeight = 750
const chartWidth = 500
const padding = { top: 20, right: 10, bottom: 10, left: 45 }
const minTimeForScale = 180 // start x axis at 3 minutes

export default function HistoryPage() {
  const { stats } = usePuzzleStats()
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; date: LocalDate; time: number } | null>(null)

  const { minDate, maxDate, years, maxTime, byDayOfWeek } = analyzeStats(stats)

  const getPointColor = (dayOfWeek: number) => {
    if (selectedDay === null || selectedDay === dayOfWeek) return getColor(dayOfWeek)
    return colors.gray[200]
  }

  const getPointRadius = (dayOfWeek: number, isHovered: boolean = false, isBest: boolean = false) => {
    let baseRadius = selectedDay !== null && selectedDay === dayOfWeek ? 3 : 2
    if (isBest) baseRadius += 2
    return isHovered ? baseRadius * 1.5 : baseRadius
  }

  // Chart dimensions and padding
  const plotWidth = chartWidth - padding.left - padding.right
  const plotHeight = chartHeight - padding.top - padding.bottom

  // Get data ranges
  const logMin = Math.log(minTimeForScale)
  const logMax = Math.log(maxTime)

  const scaleX = (time: number) => ((Math.log(time) - logMin) / (logMax - logMin)) * plotWidth

  const scaleY = (date: LocalDate) => {
    const monday = date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).toEpochDay()
    const min = minDate.toEpochDay()
    const max = maxDate.toEpochDay()
    return ((monday - min) / (max - min)) * plotHeight
  }

  // Filter stats based on selected day
  const dayFilteredStats =
    selectedDay === null //
      ? stats
      : byDayOfWeek[selectedDay]?.stats || []

  const isBestTimeForDay = (stat: PuzzleStat) => {
    if (selectedDay === null) return false
    return stat === byDayOfWeek[selectedDay]?.best
  }

  const yTickPositions = years.map(year => {
    const yearStart = LocalDate.of(year, 1, 1)
    const yearStats = dayFilteredStats.filter(stat => stat.dateSolved.year() === year)
    const yearCount = yearStats.length
    const yearAvgTime = yearCount > 0 ? Math.round(yearStats.reduce((sum, stat) => sum + stat.time, 0) / yearCount) : 0

    return {
      y: scaleY(yearStart),
      year: year,
      count: yearCount,
      avgTime: yearAvgTime,
    }
  })

  // X-axis: Logarithmic scale with nice round numbers
  // Generate logarithmic tick marks (1, 2, 5, 10, 20, 50 minutes, etc.)
  const logTickValues = []
  for (let power = 0; power <= 4; power++) {
    for (const base of [1, 2, 5]) {
      const value = base * Math.pow(10, power) * 60 // Convert to seconds
      if (value >= minTimeForScale && value <= maxTime) {
        logTickValues.push(value)
      }
    }
  }

  const xTickPositions = logTickValues.map(time => ({
    x: ((Math.log(time) - logMin) / (logMax - logMin)) * plotWidth,
    time: time,
  }))

  return (
    <div ref={containerRef} className="flex flex-col h-screen w-full gap-2 max-w-xl ">
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
                backgroundColor: selectedDay === null || selectedDay === Number(dayNum) ? getColor(dayNum) : '#cccccc',
              }}
            />
            <span className="text-xs">{dayName}</span>
          </div>
        ))}
      </div>
      <div className="relative">
        <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full">
          {/* Grid lines */}
          <g>
            {/* Horizontal grid lines (for years) */}
            {yTickPositions.map((tick, i) => (
              <line
                key={`y-grid-${i}`}
                x1={padding.left}
                y1={padding.top + tick.y}
                x2={padding.left + plotWidth}
                y2={padding.top + tick.y}
                stroke={color.axis}
                strokeWidth={1}
              />
            ))}

            {/* Vertical grid lines (for times) */}
            {xTickPositions.map((tick, i) => (
              <line
                key={`x-grid-${i}`}
                x1={padding.left + tick.x}
                y1={padding.top}
                x2={padding.left + tick.x}
                y2={padding.top + plotHeight}
                stroke={color.gridLines}
                strokeWidth={1}
              />
            ))}
          </g>

          {/* Data points */}
          <g>
            {stats
              .sort((a, b) => {
                const aIsSelected = selectedDay === null || selectedDay === a.date.dayOfWeek().value()
                const bIsSelected = selectedDay === null || selectedDay === b.date.dayOfWeek().value()
                // Sort unselected items first (false < true), selected items last
                return Number(aIsSelected) - Number(bIsSelected)
              })
              .map((stat, i) => {
                const isHovered = Boolean(tooltip && tooltip.date.equals(stat.dateSolved) && tooltip.time === stat.time)
                const isBest = isBestTimeForDay(stat)
                const dayOfWeek = stat.dateSolved.dayOfWeek().value()

                return (
                  <g key={i}>
                    <circle
                      cx={padding.left + scaleX(stat.time)}
                      cy={padding.top + scaleY(stat.dateSolved)}
                      r={getPointRadius(dayOfWeek, isHovered, isBest)}
                      fill={getPointColor(dayOfWeek)}
                      stroke={isBest ? '#ffffff' : 'transparent'}
                      strokeWidth={isBest ? 3 : 3}
                      style={{
                        cursor: 'pointer',
                        pointerEvents: 'all',
                        zIndex: isHovered ? 1000 : isBest ? 100 : 'auto',
                      }}
                      onPointerEnter={e => {
                        if (selectedDay === null || selectedDay === stat.date.dayOfWeek().value()) {
                          setTooltip({
                            x: padding.left + scaleX(stat.time),
                            y: padding.top + scaleY(stat.dateSolved),
                            date: stat.dateSolved,
                            time: stat.time,
                          })
                        }
                      }}
                      onPointerLeave={() => {
                        setTooltip(null)
                      }}
                    />
                    {isBest && (
                      <circle
                        cx={padding.left + scaleX(stat.time)}
                        cy={padding.top + scaleY(stat.dateSolved)}
                        r={getPointRadius(dayOfWeek, isHovered, isBest) + 3}
                        fill="none"
                        stroke={getPointColor(dayOfWeek)}
                        strokeWidth={2}
                        style={{ pointerEvents: 'none' }}
                      />
                    )}
                  </g>
                )
              })}
          </g>

          {/* Average time lines for each year */}
          <g>
            {yTickPositions.map((tick, i) => {
              if (tick.count === 0) return null

              const nextTick = yTickPositions[i + 1]
              const lineStartY = tick.y
              const lineEndY = nextTick ? nextTick.y : plotHeight
              const lineX = scaleX(tick.avgTime)
              const lineColor = selectedDay === null ? colors.gray['800'] : getColor(selectedDay)

              return (
                <g key={`avg-group-${i}-${selectedDay || 'all'}`}>
                  {/* Translucent box from average line to y-axis */}
                  <rect
                    x={padding.left}
                    y={padding.top + lineStartY}
                    width={lineX}
                    height={lineEndY - lineStartY}
                    fill={lineColor}
                    opacity={0.1}
                    style={{ pointerEvents: 'none' }}
                  />
                  {/* Average line */}
                  <line
                    x1={padding.left + lineX}
                    y1={padding.top + lineStartY}
                    x2={padding.left + lineX}
                    y2={padding.top + lineEndY}
                    stroke={lineColor}
                    strokeWidth={1}
                    style={{ pointerEvents: 'none' }}
                  />
                </g>
              )
            })}
          </g>

          {/* X-axis (bottom) */}
          <line
            x1={padding.left}
            y1={padding.top + plotHeight}
            x2={padding.left + plotWidth}
            y2={padding.top + plotHeight}
            stroke={color.axis}
            strokeWidth={1}
          />

          {/* Y-axis (left) */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={padding.top + plotHeight}
            stroke={color.axis}
            strokeWidth={1}
          />

          {/* X-axis labels (time labels at bottom) */}
          <g>
            {xTickPositions.map((tick, i) => (
              <g key={`x-label-${i}`}>
                <text x={padding.left + tick.x} y={10} textAnchor="middle" className="text-2xs" fill={color.text}>
                  {tick.time > 0 ? `${tick.time / 60} ${i === xTickPositions.length - 1 ? 'min' : ''}` : null}
                </text>
              </g>
            ))}
          </g>

          {/* Y-axis labels (year labels on left) */}
          <g>
            {yTickPositions.map((tick, i) => (
              <foreignObject
                key={`y-label-${i}-${selectedDay || 'all'}`}
                x={padding.left - 55}
                y={padding.top + tick.y}
                width="50"
                height="35"
              >
                <div className="flex flex-col items-end">
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
            className="absolute bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none z-10 flex flex-col gap-1"
            style={{
              left: `${(tooltip.x / chartWidth) * 100}%`,
              top: `${((tooltip.y - 10) / chartHeight) * 100}%`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div>{tooltip.date.toString()}</div>
            <div>
              {isBestTimeForDay(stats.find(s => s.dateSolved.equals(tooltip.date) && s.time === tooltip.time)!) && (
                <span>🏆</span>
              )}
              {formatTime(tooltip.time)}{' '}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
