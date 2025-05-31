import { LocalDate } from '@js-joda/core'
import { NextRequest, NextResponse } from 'next/server'
import { getStats } from '@/lib/getStats'

type RouteParams = {
  params: Promise<{
    startDate: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Get the subscriber ID from environment variables
    const subscriberId = process.env.NYT_SUBSCRIBER_ID
    if (!subscriberId)
      return NextResponse.json({ error: 'NYT_SUBSCRIBER_ID environment variable is not set' }, { status: 500 })

    // Parse the start date from the path parameter
    const { startDate: startDateParam } = await params
    let startDate: LocalDate
    try {
      startDate = LocalDate.parse(startDateParam)
    } catch (error) {
      return NextResponse.json({ error: 'Invalid date format. Use ISO format (YYYY-MM-DD)' }, { status: 400 })
    }

    const stats = await getStats({ startDate })

    // Return stats as JSON response
    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    )
  }
}
