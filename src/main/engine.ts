import {randomUUID} from 'node:crypto'
import {z} from 'zod'
import type {Attempt, Bootstrap, Library, Session, SessionConfig, Settings} from '../shared/schema'
import {allQuizzes, nextReview} from '../shared/study'
import {gradeQuestion, round} from '../shared/scoring'
import {loadLibrary} from './library'
import {sessionSchema, settingsSchema, Storage} from './storage'

const shuffle = <T>(items: T[]) => {
 const result = [...items]; for (let i = result.length - 1; i > 0; i--) {const j = Math.floor(Math.random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]} return result
}
const configSchema = z.object({quizKeys: z.array(z.string()).max(10000), mode: z.enum(['practice', 'exam']), source: z.enum(['quiz', 'mixed', 'mistakes', 'due']), count: z.number().int().min(1).max(500), timeLimitMinutes: z.number().positive().max(1440).optional(), shuffle: z.boolean(), questionKeys: z.array(z.string()).max(50000).optional()}).strict()
export class Engine {
 private settings!: Settings
 private library!: Library
 constructor(public storage: Storage, private defaultLibrary: string, private appVersion: string) {}
 async initialize() {this.settings = await this.storage.settings(this.defaultLibrary); this.library = await loadLibrary(this.settings.libraryRoot)}
 async bootstrap(): Promise<Bootstrap> {
  const attempts = await this.storage.attempts(), session = await this.storage.session(), reviews = await this.storage.reviews()
  return {library: this.library, attempts, session, reviews, settings: this.settings, dataPath: this.storage.root, warnings: [...this.storage.warnings]}
 }
 async refresh() {this.library = await loadLibrary(this.settings.libraryRoot); return this.bootstrap()}
 async updateSettings(patch: Partial<Settings>) {
  this.settings = settingsSchema.parse({...this.settings, ...patch})
  await this.storage.saveSettings(this.settings)
  if (patch.libraryRoot) this.library = await loadLibrary(patch.libraryRoot)
  return this.settings
 }
 async start(raw: SessionConfig): Promise<Session> {
  const config = configSchema.parse(raw)
  if (await this.storage.session()) throw new Error('Resume or discard your saved session before starting another.')
  const quizzes = allQuizzes(this.library).filter(q => config.quizKeys.includes(q.key))
  let questions = quizzes.flatMap(quiz => quiz.questions.map(question => ({key: `${quiz.key}/${question.id}`, quizKey: quiz.key, quizTitle: quiz.title, unitTitle: quiz.unitTitle, categoryTitle: quiz.categoryTitle, revision: quiz.revision, question, optionOrder: 'options' in question ? (quiz.shuffleOptions || question.type === 'ordering' ? shuffle(question.options.map(o => o.id)) : question.options.map(o => o.id)) : question.type === 'matching' ? shuffle(question.pairs.map(p => p.id)) : undefined})))
  if (config.questionKeys) questions = questions.filter(q => config.questionKeys!.includes(q.key))
  if (config.shuffle || quizzes.some(q => q.shuffleQuestions)) questions = shuffle(questions)
  questions = questions.slice(0, config.count)
  if (!questions.length) throw new Error('No valid questions match this selection. Refresh the library or choose another unit.')
  const now = new Date().toISOString()
  const minutes = config.mode === 'exam' ? config.timeLimitMinutes ?? (quizzes.length === 1 ? quizzes[0].timeLimitMinutes : undefined) : undefined
  const session: Session = {id: randomUUID(), title: quizzes.length === 1 && config.source === 'quiz' ? quizzes[0].title : config.source === 'due' ? 'Spaced review' : config.source === 'mistakes' ? 'Mistake practice' : 'Mixed practice', libraryRoot: this.library.root, mode: config.mode, source: config.source, startedAt: now, updatedAt: now, timeLimitMinutes: minutes, deadlineAt: minutes ? new Date(Date.now() + minutes * 60000).toISOString() : undefined, passScore: quizzes.length === 1 ? quizzes[0].passScore : 80, questions, responses: {}, currentIndex: 0, elapsedMs: 0, phase: 'answering'}
  await this.storage.saveSession(session); return session
 }
 async save(raw: Session): Promise<Session> {
  const input = sessionSchema.parse(raw), stored = await this.storage.session()
  if (!stored || stored.id !== input.id) throw new Error('This study session is no longer active.')
  if (stored.deadlineAt && Date.now() >= Date.parse(stored.deadlineAt) && stored.phase === 'answering') {
   stored.phase = stored.questions.some(q => q.question.type === 'written' || q.question.type === 'code') ? 'grading' : 'answering'
   await this.storage.saveSession(stored)
   return stored
  }
  const responses = Object.fromEntries(stored.questions.filter(q => input.responses[q.key] && (stored.phase !== 'grading' || stored.responses[q.key])).map(q => {
   const response = input.responses[q.key]
   if (stored.phase === 'grading') return [q.key, {...stored.responses[q.key], selfAssessment: response.selfAssessment}]
   if (stored.mode === 'practice' && stored.responses[q.key]?.checked) return [q.key, {...stored.responses[q.key], confidence: response.confidence, flagged: response.flagged, selfAssessment: response.selfAssessment}]
   return [q.key, {...response, selfAssessment: input.phase === 'grading' || stored.mode === 'practice' ? response.selfAssessment : undefined}]
  }))
  const updated: Session = {...stored, responses, currentIndex: Math.min(input.currentIndex, stored.questions.length - 1), elapsedMs: Math.max(stored.elapsedMs, input.elapsedMs), phase: stored.phase === 'grading' ? 'grading' : input.phase, updatedAt: new Date().toISOString()}
  await this.storage.saveSession(updated); return updated
 }
 async discard(id: string) {if ((await this.storage.session())?.id === id) await this.storage.saveSession(null)}
 private async recordReviews(attempt: Attempt) {
  const reviews = await this.storage.reviews(), byKey = new Map(reviews.map(r => [r.questionKey, r]))
  attempt.questions.forEach((q, i) => {
   const previous = byKey.get(q.key)
   if (previous && previous.lastReviewedAt >= attempt.completedAt) return
   byKey.set(q.key, nextReview(previous?.revision === q.revision ? previous : undefined, attempt.grades[i].correct, attempt.responses[q.key]?.confidence, q.key, q.revision, new Date(attempt.completedAt)))
  })
  await this.storage.saveReviews([...byKey.values()])
 }
 async finish(raw: Session): Promise<Attempt> {
  const existing = (await this.storage.attempts()).find(a => a.id === raw.id)
  if (existing) {await this.recordReviews(existing); await this.discard(existing.id); return existing}
  const session = await this.save(raw), grades = session.questions.map(q => gradeQuestion(q, session.responses[q.key]))
  const earned = round(grades.reduce((n, g) => n + g.earned, 0)), possible = round(grades.reduce((n, g) => n + g.possible, 0)), percent = earned / possible * 100
  const completedAt = new Date().toISOString()
  const attempt: Attempt = {...session, completedAt, grades, earned, possible, percent, passed: percent >= session.passScore, appVersion: this.appVersion, platform: process.platform, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone}
  await this.storage.saveAttempt(attempt)
  await this.recordReviews(attempt)
  await this.storage.saveSession(null)
  return attempt
 }
}
