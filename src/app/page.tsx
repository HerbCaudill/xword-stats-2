'use client'

import { usePuzzleStats } from '@/hooks/useStats'
import { formatDate } from '@/lib/formatDate'
import { formatTime } from '@/lib/formatTime'

export default function HistoryPage() {
  const { stats, loading, error } = usePuzzleStats()

  // Calculate summary statistics
  const totalPuzzles = stats.length
  const averageTime = totalPuzzles ? Math.round(stats.reduce((sum, stat) => sum + stat.time, 0) / totalPuzzles) : 0

  if (loading) return <div className="container mx-auto p-4">Loading...</div>

  if (error) return <div className="container mx-auto p-4 text-red-500">Error loading data: {error}</div>

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">NYT Crossword History</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-2">Total Puzzles Completed</h2>
          <p className="text-3xl font-bold">{totalPuzzles}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-2">Average Completion Time</h2>
          <p className="text-3xl font-bold">{formatTime(averageTime)}</p>
        </div>
      </div>

      {/* We can add visualization charts here in the future */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">Data Preview</h2>
        <p className="text-sm text-gray-500 mb-2">Showing most recent puzzles:</p>

        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Time</th>
              </tr>
            </thead>
            <tbody>
              {stats
                .slice(-10)
                .reverse()
                .map(stat => (
                  <tr key={stat.date.toString()} className="border-b">
                    <td className="px-4 py-2">{formatDate(stat.date)}</td>
                    <td className="px-4 py-2">{formatTime(stat.time)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
