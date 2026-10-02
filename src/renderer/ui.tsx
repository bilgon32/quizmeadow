import {useEffect, useRef, type ReactNode} from 'react'
import {createMotion} from './design-vendor/motion.mjs'
import {ArrowRight, Check, Circle, X} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import type {Attempt, LibraryQuiz, SessionQuestion} from '../shared/schema'
import {answerLabel, correctAnswer} from '../shared/scoring'
export function Page({children}: {children: ReactNode}) {
 const ref = useRef<HTMLDivElement>(null)
 useEffect(() => {const controller = createMotion(document.documentElement); ref.current?.querySelectorAll<HTMLElement>('.bgp-card,.bgp-panel,.settings-card,.empty').forEach(node => controller.enterOnce(node)); return () => controller.destroy()}, [])
 return <div ref={ref} className="page bgp-page">{children}</div>
}
export function Reveal({children, className = '', questionKey, arrival = false}: {children: ReactNode; className?: string; questionKey?: string; arrival?: boolean}) {
 const ref = useRef<HTMLDivElement>(null)
 useEffect(() => {const controller = createMotion(document.documentElement); if (ref.current) {if (arrival) controller.enterOnce(ref.current); else controller.signalChange(ref.current)}; return () => controller.destroy()}, [arrival])
 return <div ref={ref} className={className} data-question-key={questionKey}>{children}</div>
}
export function Disclosure({summary, children, className = '', open = false}: {summary: ReactNode; children: ReactNode; className?: string; open?: boolean}) {
 const ref = useRef<HTMLDetailsElement>(null), controller = useRef<ReturnType<typeof createMotion> | null>(null)
 useEffect(() => {controller.current = createMotion(document.documentElement); if (ref.current) ref.current.open = open; return () => {controller.current?.destroy(); controller.current = null}}, [])
 return <details ref={ref} className={`bgp-disclosure ${className}`}><summary onClick={e => {e.preventDefault(); if (ref.current) controller.current?.toggleDisclosure(ref.current)}}>{summary}</summary><div className="bgp-disclosure-body">{children}</div></details>
}
export function Collapse({open, controlId, children}: {open: boolean; controlId: string; children: ReactNode}) {
 const ref = useRef<HTMLDetailsElement>(null), controller = useRef<ReturnType<typeof createMotion> | null>(null)
 useEffect(() => {controller.current = createMotion(document.documentElement); return () => {controller.current?.destroy(); controller.current = null}}, [])
 useEffect(() => {const el = ref.current; if (!el) return; if (!open && el.contains(document.activeElement)) document.getElementById(controlId)?.focus(); const target = el.dataset.targetOpen === undefined ? el.open : el.dataset.targetOpen === 'true'; if (target !== open) controller.current?.toggleDisclosure(el)}, [open, controlId])
 return <details ref={ref} className="disclosure-region"><summary hidden aria-hidden="true">Answer detail</summary><div className="bgp-disclosure-body" id={`${controlId}-content`}>{children}</div></details>
}
export function Markdown({children, compact = false}: {children: string; compact?: boolean}) {return <div className={`markdown ${compact ? 'compact' : ''}`}><ReactMarkdown components={{a: ({href, children}) => <button className="text-link" onClick={() => href && window.quizmeadow.openSource(href).catch(() => {})}>{children}</button>, img: ({alt}) => <span>{alt}</span>}}>{children}</ReactMarkdown></div>}
export function Pill({children, tone = ''}: {children: ReactNode; tone?: string}) {return <span className={`pill ${tone}`}>{children}</span>}
export function Ring({value, size = 56, label}: {value: number; size?: number; label?: string}) {const circumference = 2 * Math.PI * 22; return <div className="ring" style={{width: size, height: size}}><svg viewBox="0 0 52 52" aria-hidden><circle cx="26" cy="26" r="22" className="ring-bg"/><circle cx="26" cy="26" r="22" className="ring-value" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - Math.min(100, Math.max(0, value)) / 100)}/></svg>{label && <span>{label}</span>}</div>}
export function Empty({icon, title, children, action}: {icon: ReactNode; title: string; children: ReactNode; action?: ReactNode}) {return <div className="empty"><div className="empty-icon">{icon}</div><h3>{title}</h3><p>{children}</p>{action}</div>}
export const formatDate = (s: string) => new Date(s).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})
export const duration = (ms: number) => {const sec = Math.max(0, Math.floor(ms / 1000)); return `${Math.floor(sec / 60).toString().padStart(2, '0')}:${(sec % 60).toString().padStart(2, '0')}`}
export const typeLabel = (type: string) => ({single_choice: 'Single choice', multiple_choice: 'Multiple choice', true_false: 'True or false', ordering: 'Ordering', matching: 'Matching', fill_blank: 'Fill the blanks', numeric: 'Numeric', short_answer: 'Short answer', written: 'Written response', code: 'Code response'}[type] ?? type)
export function Feedback({item, attempt}: {item: SessionQuestion; attempt: Attempt}) {
 const grade = attempt.grades.find(g => g.key === item.key)!, response = attempt.responses[item.key]
 return <div className="feedback-card"><div className="row spread"><Pill tone={grade.correct ? 'green' : grade.earned > 0 ? 'amber' : 'rose'}>{grade.correct ? <Check size={13}/> : <Circle size={12}/>} {grade.earned}/{grade.possible} points</Pill><span className="muted tiny">{typeLabel(item.question.type)} · {grade.grading === 'self' ? 'Self-assessed' : 'Automatically scored'}</span></div><div className="feedback-prompt"><Markdown>{item.question.prompt.replace(/\{\{(.*?)\}\}/g, '____')}</Markdown></div><div className="answer-comparison"><div><div className="eyebrow">YOUR ANSWER</div><pre>{answerLabel(item.question, response?.answer)}</pre></div><div><div className="eyebrow">{grade.grading === 'self' ? 'MODEL ANSWER' : 'EXPECTED ANSWER'}</div><pre>{answerLabel(item.question, correctAnswer(item.question))}</pre></div></div>{!grade.correct && response?.confidence === 'high' && <div className="callout amber">You felt confident here. Review the assumption behind your answer.</div>}{item.question.explanation && <div className="explanation"><Markdown>{item.question.explanation}</Markdown></div>}{item.question.sources.length > 0 && <div className="source-links">{item.question.sources.map(s => <button key={s.url} onClick={() => window.quizmeadow.openSource(s.url).catch(() => {})}>{s.title}<ArrowRight size={12}/></button>)}</div>}<div className="tiny muted">{item.categoryTitle} / {item.unitTitle} · {response?.confidence ? `${response.confidence} confidence` : 'Confidence unrecorded'} · {duration(response?.timeMs ?? 0)} on question</div></div>
}
export function QuizCard({quiz, attempts, onStart}: {quiz: LibraryQuiz; attempts: Attempt[]; onStart: (q: LibraryQuiz) => void}) {
 const results = attempts.filter(a => a.source === 'quiz' && a.questions.some(q => q.quizKey === quiz.key))
 const points = quiz.questions.reduce((n, q) => n + q.points, 0)
 return <article className="quiz-card bgp-card"><div className="bgp-card-head"><span>{quiz.questions.length} questions</span><span>{results.length ? `Last ${Math.round(results[0].percent)}%` : 'Not attempted'}</span></div><div className="bgp-card-body"><h3 className="bgp-card-title">{quiz.title}</h3><p>{quiz.description || 'A focused check of your understanding.'}</p><div className="quiz-tags">{quiz.tags.slice(0, 3).map(t => <span key={t}>{t}</span>)}</div></div><div className="bgp-card-foot quiz-footer"><span>{points} points{quiz.timeLimitMinutes ? ` · ${quiz.timeLimitMinutes} min exam` : ''}</span><button className="button small secondary" onClick={() => onStart(quiz)}>Start quiz<ArrowRight size={15}/></button></div></article>
}
export function Modal({title, onClose, children}: {title: string; onClose: () => void; children: ReactNode}) {
 const ref = useRef<HTMLElement>(null), close = useRef(onClose); close.current = onClose
 useEffect(() => {
  const controller = createMotion(document.documentElement)
  if (ref.current) controller.signalChange(ref.current)
  const previous = document.activeElement as HTMLElement | null
  ref.current?.querySelector<HTMLElement>('button,input,select,textarea')?.focus()
  const key = (e: KeyboardEvent) => {
   if (e.key === 'Escape') {e.preventDefault(); close.current()}
   if (e.key !== 'Tab') return
   const items = [...(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]') ?? [])].filter(el => el.offsetParent !== null)
   if (!items.length) return
   const first = items[0], last = items[items.length - 1]
   if (e.shiftKey && document.activeElement === first) {e.preventDefault(); last.focus()}
   else if (!e.shiftKey && document.activeElement === last) {e.preventDefault(); first.focus()}
  }
  document.addEventListener('keydown', key)
  return () => {controller.destroy(); document.removeEventListener('keydown', key); previous?.focus()}
 }, [])
 return <div className="modal-overlay" onClick={e => {if (e.target === e.currentTarget) onClose()}}><section ref={ref} className="modal bgp-dialog" role="dialog" aria-modal="true" aria-label={title}><div className="row spread"><h2>{title}</h2><button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={20}/></button></div>{children}</section></div>
}
