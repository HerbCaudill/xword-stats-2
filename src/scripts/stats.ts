import { LocalDate } from '@js-joda/core'
import { getStatsForDateRange, getStatsForYear } from '../lib/getStats.ts'

import dotenv from 'dotenv'
dotenv.config()

const subscriberId = process.env.NYT_SUBSCRIBER_ID
if (!subscriberId) throw new Error('NYT_SUBSCRIBER_ID environment variable is not set')

const data = await getStatsForDateRange(LocalDate.parse('2023-01-01'), LocalDate.parse('2025-12-31'), subscriberId)

console.log(data)
