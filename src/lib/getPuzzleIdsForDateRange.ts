import type { LocalDate } from '@js-joda/core'
import type { NytPuzzle } from '@/types.ts'
import { headers } from './headers.ts'

import dotenv from 'dotenv'
dotenv.config()

/**
 * Retrieves NYT Crossword puzzle IDs for a specific date range
 */
export async function getPuzzleIdsForDateRange(startDate: LocalDate, endDate: LocalDate) {
  const subscriberId = process.env.NYT_SUBSCRIBER_ID

  const url = `https://www.nytimes.com/svc/crosswords/v3/${subscriberId}/puzzles.json?publish_type=daily&date_start=${startDate.toString()}&date_end=${endDate.toString()}`

  const response = await fetch(url, { headers })

  const { results }: { results: NytPuzzle[] } = await response.json()
  const ids = (results || []) //
    .filter(({ solved }: NytPuzzle) => solved === true)
    .map(({ puzzle_id }: NytPuzzle) => puzzle_id)

  console.log(`${startDate.toString()} to ${endDate.toString()}: ${ids.length} solved puzzles`)

  return ids
}
