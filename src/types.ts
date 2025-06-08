import type { LocalDate } from '@js-joda/core'

export type PuzzleStat = {
  /** NYT ID for the puzzle */
  id: number
  /** Publication date of the puzzle */
  date: LocalDate
  /** Date when the puzzle was solved */
  dateSolved: LocalDate
  /** Time in seconds */
  time: number
}

export type NytPuzzle = {
  puzzle_id: number
  print_date: string
  publish_type: string
  last_modified: string
  solved: boolean
  percent_filled: number
  time_elapsed: number
}
