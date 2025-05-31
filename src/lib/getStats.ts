import { LocalDate } from '@js-joda/core'
import { getStatsForPuzzleIds } from './getStatsForPuzzleIds.ts'
import { getPuzzleIdsForDateRange } from './getPuzzleIdsForDateRange.ts'

/**
 * Gets stats for a specific date range, automatically chunking requests to stay under API limits
 */
export async function getStats({
  startDate,
  endDate = LocalDate.now(), // Default to today if no end date provided
}: {
  startDate: LocalDate
  endDate?: LocalDate
}) {
  // Ensure startDate is before or equal to endDate
  if (startDate.isAfter(endDate)) {
    throw new Error('Start date must be before or equal to end date')
  }

  const dateChunkSize = 100
  const idChunkSize = 100
  const allPuzzleIds: number[] = []
  let currentStart = startDate

  // Phase 1: Collect all puzzle IDs for solved puzzles in the date range
  console.log('Phase 1: Collecting puzzle IDs for solved puzzles...')
  while (!currentStart.isAfter(endDate)) {
    // Calculate end of current date chunk
    const chunkEnd = currentStart.plusDays(dateChunkSize - 1)
    const puzzleIds = await getPuzzleIdsForDateRange(currentStart, chunkEnd)
    allPuzzleIds.push(...puzzleIds)

    // Move to the next chunk
    currentStart = chunkEnd.plusDays(1)
  }

  console.log(`Phase 1 complete: Found ${allPuzzleIds.length} total solved puzzles`)

  // Phase 2: Get stats for puzzle IDs in chunks
  console.log('Phase 2: Fetching stats for puzzle IDs...')
  const results: { date: string; time: number }[] = []

  for (let i = 0; i < allPuzzleIds.length; i += idChunkSize) {
    const idChunk = allPuzzleIds.slice(i, i + idChunkSize)
    const stats = await getStatsForPuzzleIds(idChunk)
    results.push(...stats)

    console.log(`Processed ${Math.min(i + idChunkSize, allPuzzleIds.length)}/${allPuzzleIds.length} puzzle IDs`)
  }

  console.log(`Phase 2 complete: Retrieved stats for ${results.length} puzzles`)
  return results
}

export type Puzzle = {
  puzzle_id: number
  print_date: string
  publish_type: string
  last_modified: string
  solved: boolean
  percent_filled: number
  time_elapsed: number
}
