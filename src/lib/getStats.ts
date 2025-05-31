import { LocalDate } from '@js-joda/core'

/**
 * Retrieves NYT Crossword puzzle data for a specific date range
 */
export async function getPuzzleIdsForDateRange(
	startDate: LocalDate,
	endDate: LocalDate,
	subscriberId: string
) {
	const url = `https://www.nytimes.com/svc/crosswords/v3/${subscriberId}/puzzles.json?publish_type=daily&date_start=${startDate.toString()}&date_end=${endDate.toString()}`
	const response = await fetch(url)
	const { results } = (await response.json()) as { results: Puzzle[] }

	return results ? results.map(({ puzzle_id }: Puzzle) => puzzle_id) : []
}

/**
 * Retrieves NYT Crossword puzzle data for the month containing the given date
 */
export async function getPuzzleIdsForMonth(date: LocalDate = LocalDate.now(), subscriberId: string) {
	// Calculate first and last day of the month
	const dateStart = LocalDate.from(date).withDayOfMonth(1)
	const dateEnd = dateStart.plusMonths(1).minusDays(1)

	return getPuzzleIdsForDateRange(dateStart, dateEnd, subscriberId)
}

/**
 * Gets stats for a specific set of puzzle IDs
 */
async function getStatsForPuzzleIds(puzzleIds: number[], subscriberId: string) {
	if (puzzleIds.length === 0) return []

	const url = `https://www.nytimes.com/svc/crosswords/v3/${subscriberId}/progress.json?puzzle_ids=${puzzleIds.join()}`
	const response = await fetch(url)
	const { results: puzzles } = (await response.json()) as { results: Puzzle[] }

	return puzzles
		? puzzles
			.filter(({ solved }: Puzzle) => solved)
			.map(({ print_date, time_elapsed }: Puzzle) => ({ date: print_date, time: time_elapsed }))
		: []
}

/**
 * Gets stats for a specific date range, automatically chunking requests to stay under API limits
 */
export async function getStatsForDateRange(
	startDate: LocalDate,
	endDate: LocalDate,
	subscriberId: string
) {
	// Ensure startDate is before or equal to endDate
	if (startDate.isAfter(endDate)) {
		throw new Error('Start date must be before or equal to end date')
	}

	const chunkSize = 50 // Days per chunk to stay well under the 100-day limit
	const results: { date: string; time: number }[] = []
	let currentStart = startDate
	
	while (currentStart.isBefore(endDate) || currentStart.isEqual(endDate)) {
		// Calculate end of current chunk (either chunkSize days later or endDate, whichever comes first)
		const chunkEnd = currentStart.plusDays(chunkSize - 1).isAfter(endDate)
			? endDate
			: currentStart.plusDays(chunkSize - 1)
		
		const puzzleIds = await getPuzzleIdsForDateRange(currentStart, chunkEnd, subscriberId)
		const stats = await getStatsForPuzzleIds(puzzleIds, subscriberId)
		results.push(...stats)
		
		// Move to the next chunk
		currentStart = chunkEnd.plusDays(1)
	}
	
	return results
}

export async function getStatsForMonth(date: LocalDate = LocalDate.now(), subscriberId: string) {
	const dateStart = LocalDate.from(date).withDayOfMonth(1)
	const dateEnd = dateStart.plusMonths(1).minusDays(1)
	
	return getStatsForDateRange(dateStart, dateEnd, subscriberId)
}

export async function getStatsForYear(year: number, subscriberId: string) {
	const startDate = LocalDate.of(year, 1, 1)
	const endDate = LocalDate.of(year, 12, 31)
	
	return getStatsForDateRange(startDate, endDate, subscriberId)
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
