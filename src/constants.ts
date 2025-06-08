import { LocalDate } from '@js-joda/core'
import colors from 'tailwindcss/colors'

export const beginningOfTime = LocalDate.parse('2015-01-01')

export const dayNames = {
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
  7: 'Sun',
}

export const dayColors = {
  0: colors.gray[400], // Default color for invalid days
  1: colors.red[600], // Monday
  2: colors.orange[600], // Tuesday
  3: colors.yellow[600], // Wednesday
  4: colors.green[600], // Thursday
  5: colors.blue[600], // Friday
  6: colors.violet[600], // Saturday
  7: colors.pink[600], // Sunday
}
