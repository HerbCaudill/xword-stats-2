import type { NytPuzzle } from '@/types.ts'
import { headers } from './headers.ts'

/**
 * Gets stats for a specific set of puzzle IDs
 */
export async function getStatsForPuzzleIds(puzzleIds: number[]) {
  const subscriberId = process.env.NYT_SUBSCRIBER_ID

  if (puzzleIds.length === 0) return []

  const url = `https://www.nytimes.com/svc/crosswords/v3/${subscriberId}/progress.json?puzzle_ids=${puzzleIds.join()}`
  const response = await fetch(url, { headers })

  const { results: puzzles = [] }: { results: NytPuzzle[] } = await response.json()

  return puzzles
    .filter(({ solved, time_elapsed }: NytPuzzle) => solved === true && time_elapsed > 0)
    .map(({ puzzle_id, print_date, last_modified, time_elapsed }: NytPuzzle) => ({
      id: puzzle_id,
      date: print_date,
      dateSolved: last_modified.split(' ')[0],
      time: time_elapsed,
    }))
}
