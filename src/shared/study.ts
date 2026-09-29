import type {Attempt, Library, LibraryQuiz, ReviewState} from './schema'
export const allQuizzes = (library: Library): LibraryQuiz[] => library.categories.flatMap(c => c.units.flatMap(u => u.quizzes))
export function latestOutcomes(attempts: Attempt[]) {
 const latest = new Map<string, {attempt: Attempt; index: number}>()
 for (const attempt of [...attempts].sort((a, b) => a.completedAt.localeCompare(b.completedAt))) {
  attempt.questions.forEach((q, index) => latest.set(q.key, {attempt, index}))
 }
 return latest
}
export function nextReview(previous: ReviewState | undefined, correct: boolean, confidence: string | undefined, key: string, revision: string, now: Date): ReviewState {
 const intervalDays = !correct ? 1 : confidence === 'low' ? 1 : confidence === 'medium' ? Math.max(2, Math.round((previous?.intervalDays ?? 1) * 1.5)) : Math.max(3, Math.round((previous?.intervalDays ?? 1) * 2.5))
 return {questionKey: key, revision, intervalDays, dueAt: new Date(now.getTime() + intervalDays * 86400000).toISOString(), lastReviewedAt: now.toISOString()}
}
