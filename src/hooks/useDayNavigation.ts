import { useCallback } from 'react'

export function useDayNavigation(selectedDay: number | null, onDaySelect: (day: number | null) => void) {
  const navigateToNextDay = useCallback(() => {
    // from "All" go to Monday (1)
    if (selectedDay === null) onDaySelect(1)
    // from Sunday go to "All"
    else if (selectedDay === 7) onDaySelect(null)
    // go to next day
    else onDaySelect(selectedDay + 1)
  }, [selectedDay, onDaySelect])

  const navigateToPreviousDay = useCallback(() => {
    // from "All" go to Sunday (7)
    if (selectedDay === null) onDaySelect(7)
    // from Monday go to "All"
    else if (selectedDay === 1) onDaySelect(null)
    // go to previous day
    else onDaySelect(selectedDay - 1)
  }, [selectedDay, onDaySelect])

  return { navigateToNextDay, navigateToPreviousDay }
}
