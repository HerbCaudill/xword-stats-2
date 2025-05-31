import { LocalDate } from '@js-joda/core'
import { getStats } from '../lib/getStats.ts'

const subscriberId = process.env.NYT_SUBSCRIBER_ID
if (!subscriberId) throw new Error('NYT_SUBSCRIBER_ID environment variable is not set')

const data = await getStats({
  startDate: LocalDate.parse('2016-01-01'),
})

console.log(data)
