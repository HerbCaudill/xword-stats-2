import type { PuzzleStat } from '@/types'

/** Merges two arrays of stats */
export const mergeStats = (a: PuzzleStat[], b: PuzzleStat[]): PuzzleStat[] => {
  const merged = [...a]
  for (const stat of b) {
    if (!a.find(s => s.date.equals(stat.date))) merged.push(stat)
  }
  return merged
}
