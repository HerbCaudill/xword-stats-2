import type { Puzzle } from './getStats'
import { headers } from './headers.ts'

/**
 * Gets stats for a specific set of puzzle IDs
 */
export async function getStatsForPuzzleIds(puzzleIds: number[]) {
  const subscriberId = process.env.NYT_SUBSCRIBER_ID

  if (puzzleIds.length === 0) return []

  const url = `https://www.nytimes.com/svc/crosswords/v3/${subscriberId}/progress.json?puzzle_ids=${puzzleIds.join()}`
  const response = await fetch(url, { headers })

  const { results: puzzles = [] }: { results: Puzzle[] } = await response.json()

  return puzzles
    .filter(({ solved, time_elapsed }: Puzzle) => solved === true && time_elapsed > 0)
    .map(({ print_date, time_elapsed }: Puzzle) => ({ date: print_date, time: time_elapsed }))
}
