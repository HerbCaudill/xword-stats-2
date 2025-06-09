'use client'

import { analyzeStats } from '@/lib/analyzeStats'
import { formatTime } from '@/lib/formatTime'
import type { PuzzleStat } from '@/types'
import { LocalDate } from '@js-joda/core'
import { useEffect, useMemo, useState } from 'react'
import colors from 'tailwindcss/colors'
import { getColor } from './getColor'

const color = {
  axis: colors.gray[300],
  gridLines: colors.gray[300],
  text: colors.gray[600],
}

const chartHeight = 750
const chartWidth = 500
const pad = { top: 20, right: 10, bottom: 10, left: 45 }
const minTime = 180 // start x axis at 3 minutes

export function PuzzleChart({ stats, selectedDay }: Props) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  const {
    minDate, // The earliest date in the dataset
    maxDate, // The latest date in the dataset
    years, // An array of years present in the dataset
    maxTime, // The maximum time taken to solve a puzzle
    byDayOfWeek, // Stats grouped by day of the week
    trailingAverages, // Overall trailing averages
    trailingAveragesByDay, // Trailing averages grouped by day
  } = useMemo(() => {
    console.log(`Analyzing ${stats.length} stats...`)
    return analyzeStats(stats)
  }, [stats.length])

  const getPointColor = (dayOfWeek: number) => {
    if (selectedDay === null || selectedDay === dayOfWeek) return getColor(dayOfWeek)
    return colors.gray[200]
  }

  const getPointRadius = (dayOfWeek: number, isHovered: boolean = false, isBest: boolean = false) => {
    let baseRadius = 3 //selectedDay === null || selectedDay === dayOfWeek ? 3 : 2
    if (isBest) baseRadius += 1
    return isHovered ? baseRadius * 1.2 : baseRadius
  }

  // Chart dimensions and padding
  const plotWidth = chartWidth - pad.left - pad.right
  const plotHeight = chartHeight - pad.top - pad.bottom

  // Get data ranges
  const logMin = Math.log(minTime)
  const logMax = Math.log(maxTime)
  console.log({ maxTime, logMax })

  const scaleX = (time: number) => ((Math.log(time) - logMin) / (logMax - logMin)) * plotWidth

  const scaleY = (date: LocalDate) => {
    const min = minDate.toEpochDay()
    const max = maxDate.toEpochDay()
    return ((date.toEpochDay() - min) / (max - min)) * plotHeight
  }

  const yTicks = years.map(year => {
    const yearStart = LocalDate.of(year, 1, 1)
    const filteredStats = selectedDay !== null ? byDayOfWeek[selectedDay]?.stats : stats
    const yearStats = filteredStats.filter(stat => stat.dateSolved.year() === year)
    const yearCount = yearStats.length
    const yearAvgTime = yearCount > 0 ? Math.round(yearStats.reduce((sum, stat) => sum + stat.time, 0) / yearCount) : 0

    return {
      y: scaleY(yearStart),
      year: year,
      count: yearCount,
      avgTime: yearAvgTime,
    }
  })

  // X-axis: Logarithmic scale with nice round numbers (1, 2, 5, 10, 20, 50 minutes, etc.)
  const logTickValues = [5, 10, 15, 30, 60].map(min => min * 60) // Convert to seconds

  const xTicks = logTickValues.map(time => ({ x: scaleX(time), time }))

  const best = selectedDay !== null ? byDayOfWeek[selectedDay]?.best : undefined
  const latest = selectedDay !== null ? byDayOfWeek[selectedDay]?.latest : undefined

  // Create path for trailing average line - use day-specific averages when a day is selected
  const currentTrailingAverages = selectedDay !== null ? trailingAveragesByDay[selectedDay] : trailingAverages

  // Filter to only show trailing averages up to current date
  const today = LocalDate.now()
  const filteredTrailingAverages = currentTrailingAverages.filter(point => !point.date.isAfter(today))

  const trailingAveragePath = filteredTrailingAverages
    .map((point, index) => {
      const x = scaleX(point.average)
      const y = scaleY(point.date)
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')

  const showTooltip = (stat: PuzzleStat) => {
    if (selectedDay === null || selectedDay === stat.date.dayOfWeek().value()) {
      // Clear existing timeout if any
      if (tooltip?.timeoutId) clearTimeout(tooltip.timeoutId)

      const timeoutId = setTimeout(() => setTooltip(null), 5000)

      setTooltip({
        x: pad.left + scaleX(stat.time),
        y: pad.top + scaleY(stat.dateSolved),
        stat: stat,
        timeoutId,
      })
    }
  }

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (tooltip?.timeoutId) clearTimeout(tooltip.timeoutId)
    }
  }, [tooltip?.timeoutId])

  return (
    <div className="flex flex-col">
      <div className="relative">
        <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full">
          {/* Grid lines */}
          <g>
            {/* Horizontal grid lines (for years) */}
            {yTicks.map((tick, i) => (
              <line
                key={`y-grid-${i}`}
                x1={pad.left}
                y1={pad.top + tick.y}
                x2={pad.left + plotWidth}
                y2={pad.top + tick.y}
                stroke={color.axis}
                strokeWidth={1}
              />
            ))}

            {/* Vertical grid lines (for times) */}
            {xTicks.map((tick, i) => (
              <line
                key={`x-grid-${i}`}
                x1={pad.left + tick.x}
                y1={pad.top}
                x2={pad.left + tick.x}
                y2={pad.top + plotHeight}
                stroke={color.gridLines}
                strokeWidth={1}
              />
            ))}
          </g>

          {/* Data points */}
          <g>
            {stats
              .sort((a, b) => {
                // Sort hovered item last (to render on top)
                if (tooltip?.stat === a) return 1
                if (tooltip?.stat === b) return -1

                if (selectedDay === null) return 0 // No selection, keep original order

                // Sort selected items last (to render on top of unselected)
                if (selectedDay === a.date.dayOfWeek().value()) return 1
                if (selectedDay === b.date.dayOfWeek().value()) return -1
                return 0
              })
              .map((stat, i) => {
                const isHovered = tooltip?.stat === stat
                const isBest = stat === best
                const isLatest = stat === latest
                const dayOfWeek = stat.date.dayOfWeek().value()

                return (
                  <g key={i}>
                    {/* Highlight selected */}
                    {isHovered && (
                      <circle
                        cx={pad.left + scaleX(stat.time)}
                        cy={pad.top + scaleY(stat.dateSolved)}
                        r={getPointRadius(dayOfWeek, isHovered, isBest) + 4}
                        fill="white"
                        stroke="#000000"
                        strokeWidth={1}
                        style={{ pointerEvents: 'none' }}
                      />
                    )}
                    <circle
                      cx={pad.left + scaleX(stat.time)}
                      cy={pad.top + scaleY(stat.dateSolved)}
                      r={getPointRadius(dayOfWeek, isHovered, isBest)}
                      fill={isLatest ? '#ffffff' : getPointColor(dayOfWeek)}
                      stroke={isBest ? '#ffffff' : isLatest ? getColor(dayOfWeek) : 'transparent'}
                      strokeWidth={isBest ? 3 : 3}
                      style={{
                        cursor: 'pointer',
                        pointerEvents: 'all',
                        zIndex: isHovered ? 1000 : isBest ? 100 : 'auto',
                      }}
                      onClick={() => showTooltip(stat)}
                    />

                    {/* Highlight best time */}
                    {isBest && (
                      <circle
                        cx={pad.left + scaleX(stat.time)}
                        cy={pad.top + scaleY(stat.dateSolved)}
                        r={getPointRadius(dayOfWeek, isHovered, isBest) + 2}
                        fill="none"
                        stroke={getColor(dayOfWeek)}
                        strokeWidth={2}
                        style={{ pointerEvents: 'none' }}
                      />
                    )}
                  </g>
                )
              })}
          </g>

          {/* X-axis (bottom) */}
          <line
            x1={pad.left}
            y1={pad.top + plotHeight}
            x2={pad.left + plotWidth}
            y2={pad.top + plotHeight}
            stroke={color.axis}
            strokeWidth={1}
          />

          {/* Y-axis (left) */}
          <line
            x1={pad.left}
            y1={pad.top}
            x2={pad.left}
            y2={pad.top + plotHeight}
            stroke={color.axis}
            strokeWidth={1}
          />

          {/* X-axis labels (time labels at bottom) */}
          <g>
            {xTicks.map((tick, i) => (
              <g key={`x-label-${i}`}>
                <text x={pad.left + tick.x} y={10} textAnchor="middle" className="text-2xs" fill={color.text}>
                  {tick.time > 0 ? `${tick.time / 60} ${i === xTicks.length - 1 ? 'min' : ''}` : null}
                </text>
              </g>
            ))}
          </g>

          {/* Y-axis labels (year labels on left) */}
          <g>
            {yTicks.map((tick, i) => (
              <foreignObject
                key={`y-label-${i}-${selectedDay || 'all'}`}
                x={pad.left - 55}
                y={pad.top + tick.y}
                width="50"
                height="35"
              >
                <div className="flex flex-col items-end">
                  <div className="font-bold font-serif text-xs text-gray-800">{tick.year}</div>
                  {tick.count > 0 ? (
                    <div className="text-gray-500 font-mono text-3xs">
                      {Math.floor(tick.avgTime / 60)}:{(tick.avgTime % 60).toString().padStart(2, '0')}
                    </div>
                  ) : null}
                </div>
              </foreignObject>
            ))}
          </g>

          {/* Trailing average line */}
          {filteredTrailingAverages.length > 0 && (
            <g transform={`translate(${pad.left}, ${pad.top})`}>
              <path
                d={trailingAveragePath}
                stroke={getColor(selectedDay)}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={15}
                fill="none"
                opacity={0.3}
                style={{ pointerEvents: 'none' }}
              />
            </g>
          )}

          {/* Average time lines for each year */}
          <g>
            {yTicks.map((tick, i) => {
              if (tick.count === 0) return null

              const nextTick = yTicks[i + 1]
              const lineStartY = tick.y
              const lineEndY = nextTick ? nextTick.y : plotHeight
              const lineX = scaleX(tick.avgTime)
              const lineColor = getColor(selectedDay)

              return (
                <g key={`avg-group-${i}-${selectedDay || 'all'}`}>
                  {/* Translucent box from average line to y-axis */}
                  <rect
                    x={pad.left}
                    y={pad.top + lineStartY}
                    width={lineX}
                    height={lineEndY - lineStartY}
                    fill={lineColor}
                    opacity={0.05}
                    style={{ pointerEvents: 'none' }}
                  />
                  {/* Average line */}
                  <line
                    x1={pad.left + lineX}
                    y1={pad.top + lineStartY}
                    x2={pad.left + lineX}
                    y2={pad.top + lineEndY}
                    stroke={lineColor}
                    strokeWidth={1}
                    style={{ pointerEvents: 'none' }}
                  />
                </g>
              )
            })}
          </g>
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute bg-white border font-mono text-xs px-2 py-1 rounded shadow-lg pointer-events-none z-10 flex flex-col gap-1 whitespace-nowrap"
            style={{
              left: `${(tooltip.x / chartWidth) * 100}%`,
              top: `${((tooltip.y - 10) / chartHeight) * 100}%`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div>{tooltip.stat.dateSolved.toString()}</div>
            <div>
              {tooltip.stat === best ? <span>🏆 </span> : null}
              {formatTime(tooltip.stat.time)}
            </div>
          </div>
        )}
      </div>
      {latest && best ? (
        <div className="text-xs text-gray-800 px-3 flex gap-2">
          {/* most recent */}
          <span>
            Latest <strong className="font-mono">{formatTime(latest.time)}</strong>
          </span>

          {/* best */}
          <span>
            Best <strong className="font-mono">{formatTime(best.time)}</strong>
          </span>
        </div>
      ) : null}
    </div>
  )
}

type Props = {
  stats: PuzzleStat[]
  selectedDay: number | null
}

type TooltipState = {
  x: number
  y: number
  stat: PuzzleStat
  timeoutId: NodeJS.Timeout
}
