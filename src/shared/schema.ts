import { z } from 'zod'

const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use a stable lowercase kebab-case ID')
const text = z.string().trim().min(1).max(20000)
const base = {
 id, prompt: text, points: z.number().min(0.0001).max(1000).multipleOf(0.0001), explanation: z.string().max(20000).default(''),
 sources: z.array(z.object({title: text, url: z.url()}).strict()).default([]), tags: z.array(text).default([]),
 difficulty: z.enum(['foundation', 'applied', 'advanced']).default('applied')
}
const option = z.object({id, text}).strict()
const choice = {options: z.array(option).min(2).max(30)}
const rubric = z.array(z.object({id, description: text, points: z.number().min(0.0001).multipleOf(0.0001)}).strict()).min(1)
export const questionSchema = z.discriminatedUnion('type', [
 z.object({...base, type: z.literal('single_choice'), ...choice, answer: id}).strict(),
 z.object({...base, type: z.literal('multiple_choice'), ...choice, answer: z.array(id).min(1), partialCredit: z.boolean().default(false)}).strict(),
 z.object({...base, type: z.literal('true_false'), answer: z.boolean()}).strict(),
 z.object({...base, type: z.literal('ordering'), ...choice, answer: z.array(id).min(2), partialCredit: z.boolean().default(false)}).strict(),
 z.object({...base, type: z.literal('matching'), pairs: z.array(z.object({id, left: text, right: text}).strict()).min(2), partialCredit: z.boolean().default(false)}).strict(),
 z.object({...base, type: z.literal('fill_blank'), blanks: z.array(z.object({id, answers: z.array(text).min(1)}).strict()).min(1), caseSensitive: z.boolean().default(false), partialCredit: z.boolean().default(false)}).strict(),
 z.object({...base, type: z.literal('numeric'), answer: z.number(), tolerance: z.number().nonnegative().default(0), unit: z.string().default('')}).strict(),
 z.object({...base, type: z.literal('short_answer'), answers: z.array(text).min(1), caseSensitive: z.boolean().default(false)}).strict(),
 z.object({...base, type: z.literal('written'), rubric, modelAnswer: text}).strict(),
 z.object({...base, type: z.literal('code'), rubric, modelAnswer: text, language: text.default('csharp')}).strict()
]).superRefine((q, ctx) => {
 const issue = (message: string) => ctx.addIssue({code: 'custom', message})
 if ('options' in q) {
  const ids = q.options.map(o => o.id)
  if (new Set(ids).size !== ids.length) issue('Option IDs must be unique')
  const answers = typeof q.answer === 'string' ? [q.answer] : q.answer
  if (answers.some(a => !ids.includes(a)) || new Set(answers).size !== answers.length) issue('Answers must reference unique existing option IDs')
  if (q.type === 'ordering' && answers.length !== ids.length) issue('Ordering answer must contain every option ID exactly once')
 }
 if ('rubric' in q) {
  if (Math.abs(q.rubric.reduce((n, r) => n + r.points, 0) - q.points) > 0.00001) issue('Rubric points must add up to question points')
  if (new Set(q.rubric.map(r => r.id)).size !== q.rubric.length) issue('Rubric IDs must be unique')
 }
 if (q.type === 'matching' && new Set(q.pairs.map(p => p.id)).size !== q.pairs.length) issue('Pair IDs must be unique')
 if (q.type === 'fill_blank') {
  if (new Set(q.blanks.map(b => b.id)).size !== q.blanks.length) issue('Blank IDs must be unique')
  const placeholders = [...q.prompt.matchAll(/\{\{([a-z0-9-]+)\}\}/g)].map(m => m[1])
  if (q.blanks.some(b => !placeholders.includes(b.id)) || placeholders.some(p => !q.blanks.some(b => b.id === p))) issue('Every {{blank-id}} placeholder must have a corresponding blank, and vice versa')
 }
})
export const quizSchema = z.object({
 schemaVersion: z.literal(1), id, title: text, description: z.string().default(''),
 tags: z.array(text).default([]), passScore: z.number().min(0).max(100).default(80),
 timeLimitMinutes: z.number().positive().max(1440).optional(),
 shuffleQuestions: z.boolean().default(false), shuffleOptions: z.boolean().default(true),
 questions: z.array(questionSchema).min(1).max(500)
}).strict().superRefine((quiz, ctx) => {
 if (new Set(quiz.questions.map(q => q.id)).size !== quiz.questions.length) ctx.addIssue({code: 'custom', message: 'Question IDs must be unique within a quiz'})
})
export const categorySchema = z.object({id, title: text, description: z.string().default(''), color: z.enum(['violet', 'blue', 'green', 'amber', 'rose']).default('violet'), order: z.number().default(0)}).strict()
export const unitSchema = z.object({id, title: text, description: z.string().default(''), order: z.number().default(0)}).strict()
export type Question = z.infer<typeof questionSchema>
export type Quiz = z.infer<typeof quizSchema>
export type Category = z.infer<typeof categorySchema> & {units: Unit[]}
export type Unit = z.infer<typeof unitSchema> & {quizzes: LibraryQuiz[]}
export type LibraryQuiz = Quiz & {key: string; categoryId: string; categoryTitle: string; unitId: string; unitTitle: string; filePath: string; revision: string}
export type Library = {root: string; categories: Category[]; issues: {file: string; message: string}[]; loadedAt: string}

export type Answer = string | string[] | number | boolean | Record<string, string> | null
export type Response = {answer: Answer; confidence?: 'low' | 'medium' | 'high'; flagged?: boolean; checked?: boolean; timeMs: number; selfAssessment?: string[]}
export type SessionQuestion = {key: string; quizKey: string; quizTitle: string; unitTitle: string; categoryTitle: string; revision: string; question: Question; optionOrder?: string[]}
export type Session = {
 id: string; title: string; libraryRoot: string; mode: 'practice' | 'exam'; source: 'quiz' | 'mixed' | 'mistakes' | 'due';
 startedAt: string; updatedAt: string; timeLimitMinutes?: number; deadlineAt?: string; passScore: number;
 questions: SessionQuestion[]; responses: Record<string, Response>; currentIndex: number;
 elapsedMs: number; phase: 'answering' | 'grading';
}
export type Grade = {key: string; earned: number; possible: number; correct: boolean; answered: boolean; grading: 'automatic' | 'self'}
export type Attempt = Session & {completedAt: string; grades: Grade[]; earned: number; possible: number; percent: number; passed: boolean; appVersion: string; platform: string; timezone: string}
export type ReviewState = {questionKey: string; revision: string; intervalDays: number; dueAt: string; lastReviewedAt: string}
export type Settings = {libraryRoot: string; theme: 'light' | 'dark' | 'system'; weeklyGoal: number; bookmarks: string[]}
export type Bootstrap = {library: Library; attempts: Attempt[]; session: Session | null; settings: Settings; reviews: ReviewState[]; dataPath: string; warnings: string[]}
export type SessionConfig = {quizKeys: string[]; mode: 'practice' | 'exam'; source: Session['source']; count: number; timeLimitMinutes?: number; shuffle: boolean; questionKeys?: string[]}
export interface QuizMeadowAPI {
 bootstrap(): Promise<Bootstrap>; chooseLibrary(): Promise<Bootstrap | null>; refresh(): Promise<Bootstrap>;
 start(config: SessionConfig): Promise<Session>; save(session: Session): Promise<void>; discard(id: string): Promise<void>;
 finish(session: Session): Promise<Attempt>; settings(patch: Partial<Settings>): Promise<Settings>;
 export(format: 'json' | 'csv' | 'markdown'): Promise<string | null>; revealLibrary(): Promise<void>; revealData(): Promise<void>;
 openSource(url: string): Promise<void>; onLibraryChange(callback: () => void): () => void;
 onCloseRequest(callback: () => Promise<void>): () => void;
}
