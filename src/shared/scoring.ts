import type {Answer, Grade, Question, Response, SessionQuestion} from './schema'
export const round = (n: number) => Math.round((n + Number.EPSILON) * 10000) / 10000
const normalized = (v: string, sensitive = false) => {
 const s = v.normalize('NFKC').trim().replace(/\s+/g, ' ')
 return sensitive ? s : s.toLocaleLowerCase('en-US')
}
const strings = (a: Answer): string[] => Array.isArray(a) ? a : []
const record = (a: Answer): Record<string, string> => Object.assign(Object.create(null), a && typeof a === 'object' && !Array.isArray(a) ? a : {})
export const isAnswered = (a: Answer | undefined): boolean => a !== undefined && a !== null &&
 (typeof a === 'string' ? a.trim().length > 0 : Array.isArray(a) ? a.length > 0 : typeof a === 'object' ? Object.values(a).some(v => v.trim().length > 0) : true)

export function gradeQuestion(item: SessionQuestion, response?: Response): Grade {
 const q = item.question, a = response?.answer ?? null
 const answered = isAnswered(a)
 let fraction = 0
 switch (q.type) {
  case 'single_choice': case 'true_false': fraction = a === q.answer ? 1 : 0; break
  case 'multiple_choice': {
   const picked = [...new Set(strings(a))], correct = picked.filter(v => q.answer.includes(v)).length
   fraction = q.partialCredit ? Math.max(0, (correct - (picked.length - correct)) / q.answer.length) : picked.length === q.answer.length && correct === q.answer.length ? 1 : 0
   break
  }
  case 'ordering': {
   const values = strings(a), hits = q.answer.filter((v, i) => v === values[i]).length
   fraction = q.partialCredit ? hits / q.answer.length : hits === q.answer.length && values.length === q.answer.length ? 1 : 0
   break
  }
  case 'matching': {
   const values = record(a), hits = q.pairs.filter(p => values[p.id] === p.id).length
   fraction = q.partialCredit ? hits / q.pairs.length : hits === q.pairs.length ? 1 : 0; break
  }
  case 'fill_blank': {
   const values = record(a), hits = q.blanks.filter(b => b.answers.some(s => normalized(s, q.caseSensitive) === normalized(values[b.id] ?? '', q.caseSensitive))).length
   fraction = q.partialCredit ? hits / q.blanks.length : hits === q.blanks.length ? 1 : 0; break
  }
  case 'numeric': fraction = typeof a === 'number' && Number.isFinite(a) && Math.abs(a - q.answer) <= q.tolerance + 1e-10 ? 1 : 0; break
  case 'short_answer': fraction = typeof a === 'string' && q.answers.some(v => normalized(v, q.caseSensitive) === normalized(a, q.caseSensitive)) ? 1 : 0; break
  case 'written': case 'code': {
   const achieved = new Set(response?.selfAssessment ?? [])
   fraction = answered ? q.rubric.filter(r => achieved.has(r.id)).reduce((n, r) => n + r.points, 0) / q.points : 0; break
  }
 }
 const earned = answered ? round(q.points * Math.min(1, Math.max(0, fraction))) : 0
 return {key: item.key, earned, possible: q.points, correct: earned === q.points, answered, grading: q.type === 'written' || q.type === 'code' ? 'self' : 'automatic'}
}
export function answerLabel(q: Question, answer?: Answer): string {
 if (answer === undefined || answer === null) return 'No answer'
 if (q.type === 'single_choice') return q.options.find(o => o.id === answer)?.text ?? String(answer)
 if (q.type === 'multiple_choice' || q.type === 'ordering') return strings(answer).map(id => q.options.find(o => o.id === id)?.text ?? id).join(q.type === 'ordering' ? ' → ' : ', ')
 if (q.type === 'matching') return q.pairs.map(p => `${p.left} → ${q.pairs.find(r => r.id === record(answer)[p.id])?.right ?? '—'}`).join('\n')
 if (q.type === 'fill_blank') return q.blanks.map(b => `${b.id}: ${record(answer)[b.id] || '—'}`).join('\n')
 return String(answer)
}
export function correctAnswer(q: Question): Answer {
 if ('answer' in q) return q.answer
 if (q.type === 'matching') return Object.fromEntries(q.pairs.map(p => [p.id, p.id]))
 if (q.type === 'fill_blank') return Object.fromEntries(q.blanks.map(b => [b.id, b.answers[0]]))
 if (q.type === 'short_answer') return q.answers[0]
 return q.modelAnswer
}
