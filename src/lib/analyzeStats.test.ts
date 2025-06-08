import _persistedStats from '../data/persistedStats.json'
import { PuzzleStat } from '../types'
import { describe, expect, it } from 'vitest'
import { analyzeStats } from './analyzeStats'
import { hydrate } from './hydrate'

const stats = hydrate(_persistedStats)

describe('analyzeStats', () => {
  it('should analyze puzzle statistics correctly', () => {
    const result = analyzeStats(stats as PuzzleStat[])

    expect(result.average).toMatchInlineSnapshot(`1197`)
    expect(result.best).toMatchInlineSnapshot(`
      {
        "date": "2021-08-02",
        "dateSolved": "2021-08-03",
        "id": 19428,
        "time": 259,
      }
    `)
    expect(result.total).toMatchInlineSnapshot(`1869421`)
    expect(result.stats.length).toMatchInlineSnapshot(`1562`)

    expect(result.minDate.toString()).toMatchInlineSnapshot(`"2015-01-01"`)
    expect(result.maxDate.toString()).toMatchInlineSnapshot(`"2025-12-31"`)

    expect(result.years).toMatchInlineSnapshot(`
      [
        2015,
        2016,
        2017,
        2018,
        2019,
        2020,
        2021,
        2022,
        2023,
        2024,
        2025,
      ]
    `)

    const monday = result.byDayOfWeek['1']
    expect(monday.average).toMatchInlineSnapshot(`475`)
    expect(monday.best?.time).toMatchInlineSnapshot(`259`)
    expect(monday.total).toMatchInlineSnapshot(`95972`)
    expect(monday.stats.length).toMatchInlineSnapshot(`202`)
  })
})
