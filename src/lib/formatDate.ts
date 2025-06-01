import { DateTimeFormatter, type LocalDate } from '@js-joda/core'
import { Locale } from '@js-joda/locale_en-us'

export const DAY_OF_WEEK = 'eee'
export const DAY_OF_MONTH = 'd'

export const formatDate = (date: LocalDate, pattern: string = 'd/M/yyyy', locale = Locale.US) => {
  const formatter = DateTimeFormatter.ofPattern(pattern).withLocale(locale)
  return date.format(formatter)
}
