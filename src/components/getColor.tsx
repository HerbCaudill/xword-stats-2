'use client'
import { dayColors } from '@/constants'

export const getColor = (dayOfWeek: string | number | null) =>
  dayColors[Number(dayOfWeek) as keyof typeof dayColors] || dayColors[0]
