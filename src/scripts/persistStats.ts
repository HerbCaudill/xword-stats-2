import { beginningOfTime } from '../constants.ts'
import { getStats } from '../lib/getStats.ts'
import { writeFile } from 'fs/promises'
import { resolve } from 'path'

const data = await getStats({ startDate: beginningOfTime })

// write data JSON file
const filePath = resolve('src/data/persistedStats.json')
await writeFile(filePath, JSON.stringify(data, null, 2))

console.log(`Persisted ${data.length} stats to ${filePath}`)
