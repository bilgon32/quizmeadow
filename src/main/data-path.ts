import path from 'node:path'
import {existsSync} from 'node:fs'

export function resolveDataPath(appData: string, currentData: string, override?: string): string {
 if (override) return override
 const legacy = path.join(appData, 'recall-study')
 // Defaults are not written to settings.json until a preference changes.
 const markers = ['settings.json', 'session.json', 'reviews.json', 'library', 'attempts']
 return markers.some(name => existsSync(path.join(legacy, name))) ? legacy : currentData
}
