import {mkdir, readFile, rename, writeFile, readdir, copyFile} from 'node:fs/promises'
import path from 'node:path'
import {randomUUID} from 'node:crypto'
import {z} from 'zod'
import {questionSchema, type Attempt, type Settings, type Session, type ReviewState} from '../shared/schema'

const responseSchema = z.object({answer: z.union([z.string().max(20000), z.array(z.string().max(20000)).max(500), z.number().finite(), z.boolean(), z.record(z.string(), z.string().max(20000)), z.null()]), confidence: z.enum(['low', 'medium', 'high']).optional(), flagged: z.boolean().optional(), checked: z.boolean().optional(), timeMs: z.number().min(0).max(1e12), selfAssessment: z.array(z.string()).max(100).optional()}).strict()
export const sessionSchema = z.object({
 id: z.uuid(), title: z.string(), libraryRoot: z.string(), mode: z.enum(['practice', 'exam']), source: z.enum(['quiz', 'mixed', 'mistakes', 'due']),
 startedAt: z.iso.datetime(), updatedAt: z.iso.datetime(), timeLimitMinutes: z.number().positive().optional(), deadlineAt: z.iso.datetime().optional(),
 passScore: z.number().min(0).max(100), questions: z.array(z.object({key: z.string(), quizKey: z.string(), quizTitle: z.string(), unitTitle: z.string(), categoryTitle: z.string(), revision: z.string(), question: questionSchema, optionOrder: z.array(z.string()).optional()})).min(1).max(500),
 responses: z.record(z.string(), responseSchema), currentIndex: z.number().int().min(0), elapsedMs: z.number().nonnegative().max(1e12), phase: z.enum(['answering', 'grading'])
})
const attemptSchema = sessionSchema.extend({completedAt: z.iso.datetime(), grades: z.array(z.object({key: z.string(), earned: z.number(), possible: z.number(), correct: z.boolean(), answered: z.boolean(), grading: z.enum(['automatic', 'self'])})), earned: z.number(), possible: z.number(), percent: z.number().min(0).max(100), passed: z.boolean(), appVersion: z.string(), platform: z.string(), timezone: z.string()})
export const settingsSchema = z.object({libraryRoot: z.string(), theme: z.enum(['light', 'dark', 'system']), weeklyGoal: z.number().int().min(1).max(1000), bookmarks: z.array(z.string()).max(10000)})
const reviewSchema = z.array(z.object({questionKey: z.string(), revision: z.string(), intervalDays: z.number().positive(), dueAt: z.iso.datetime(), lastReviewedAt: z.iso.datetime()}))

export async function atomicWrite(file: string, value: unknown) {
 await mkdir(path.dirname(file), {recursive: true})
 const temporary = `${file}.${randomUUID()}.tmp`
 await writeFile(temporary, JSON.stringify({schemaVersion: 1, data: value}, null, 2), {encoding: 'utf8', mode: 0o600, flush: true})
 await rename(temporary, file)
}
export class Storage {
 warnings: string[] = []
 private corrupt = new Set<string>()
 constructor(public root: string) {}
 private file(name: string) {return path.join(this.root, name)}
 async read<T>(name: string, schema: z.ZodType<T>, fallback: T): Promise<T> {
  try {const value = JSON.parse(await readFile(this.file(name), 'utf8')); if (value.schemaVersion !== 1) throw new Error('Unsupported data schema version'); return schema.parse(value.data)}
  catch (err) {
   if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
    const warning = `Could not load ${name}: ${err instanceof Error ? err.message : err}. The original file has been preserved.`
    if (!this.warnings.includes(warning)) this.warnings.push(warning)
    this.corrupt.add(name)
   }
   return fallback
  }
 }
 async settings(defaultRoot: string): Promise<Settings> {return this.read('settings.json', settingsSchema, {libraryRoot: defaultRoot, theme: 'system', weeklyGoal: 3, bookmarks: []})}
 async session(): Promise<Session | null> {return this.read('session.json', sessionSchema.nullable(), null)}
 async attempts(): Promise<Attempt[]> {
  const dir = this.file('attempts'); await mkdir(dir, {recursive: true})
  const items: Attempt[] = []
  for (const name of (await readdir(dir)).filter(n => /^[a-f0-9-]+\.json$/.test(n))) {
   const item = await this.read(`attempts/${name}`, attemptSchema.nullable(), null)
   if (item) items.push(item)
  }
  return items.sort((a, b) => b.completedAt.localeCompare(a.completedAt))
 }
 async reviews(): Promise<ReviewState[]> {return this.read('reviews.json', reviewSchema, [])}
 async preserve(name: string) {
  try {await copyFile(this.file(name), this.file(`${name}.backup-${Date.now()}`))} catch (err) {if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err}
 }
 async saveSettings(settings: Settings) {await this.preserve('settings.json'); await atomicWrite(this.file('settings.json'), settings)}
 async saveSession(session: Session | null) {if (this.corrupt.has('session.json')) {await this.preserve('session.json'); this.corrupt.delete('session.json')} await atomicWrite(this.file('session.json'), session)}
 async saveAttempt(attempt: Attempt) {await atomicWrite(this.file(`attempts/${attempt.id}.json`), attempt)}
 async saveReviews(reviews: ReviewState[]) {if (this.corrupt.has('reviews.json')) {await this.preserve('reviews.json'); this.corrupt.delete('reviews.json')} await atomicWrite(this.file('reviews.json'), reviews)}
}
