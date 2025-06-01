import { LocalDate } from '@js-joda/core'
import { getStats } from '../lib/getStats.ts'

const data = await getStats({
  startDate: LocalDate.parse('2025-03-01'),
})

console.log(data)
