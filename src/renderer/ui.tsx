import {useEffect, useRef, type ReactNode} from 'react'
import {motion} from 'motion/react'
import {ArrowRight, Check, Circle, X} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import type {Attempt, LibraryQuiz, SessionQuestion} from '../shared/schema'
import {answerLabel, correctAnswer} from '../shared/scoring'
export const fade = {initial: {opacity: 0, y: 8}, animate: {opacity: 1, y: 0}, exit: {opacity: 0, y: -4}, transition: {duration: .22}}
export function Page({children}: {children: ReactNode}) {return <motion.div {...fade} className="page">{children}</motion.div>}
export function Markdown({children, compact = false}: {children: string; compact?: boolean}) {return <div className={`markdown ${compact ? 'compact' : ''}`}><ReactMarkdown components={{a: ({href, children}) => <button className="text-link" onClick={() => href && window.quizmeadow.openSource(href).catch(() => {})}>{children}</button>, img: ({alt}) => <span>{alt}</span>}}>{children}</ReactMarkdown></div>}
export function Pill({children, tone = ''}: {children: ReactNode; tone?: string}) {return <span className={`pill ${tone}`}>{children}</span>}
export function Ring({value, size = 56, label}: {value: number; size?: number; label?: string}) {const circumference = 2 * Math.PI * 22; return <div className="ring" style={{width: size, height: size}}><svg viewBox="0 0 52 52" aria-hidden><circle cx="26" cy="26" r="22" className="ring-bg"/><motion.circle cx="26" cy="26" r="22" className="ring-value" strokeDasharray={circumference} initial={{strokeDashoffset: circumference}} animate={{strokeDashoffset: circumference * (1 - Math.min(100, Math.max(0, value)) / 100)}} transition={{duration: .8}}/></svg>{label && <span>{label}</span>}</div>}
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
 return <div className="quiz-card"><div className="row spread"><Pill>{quiz.questions.length} questions</Pill>{results.length ? <span className="tiny muted">Last {Math.round(results[0].percent)}%</span> : <span className="tiny muted">Not attempted</span>}</div><h3>{quiz.title}</h3><p>{quiz.description || 'A focused check of your understanding.'}</p><div className="quiz-tags">{quiz.tags.slice(0, 3).map(t => <span key={t}>{t}</span>)}</div><div className="row spread quiz-footer"><span className="tiny muted">{points} points{quiz.timeLimitMinutes ? ` · ${quiz.timeLimitMinutes} min exam` : ''}</span><button className="button small secondary" onClick={() => onStart(quiz)}>Start quiz<ArrowRight size={15}/></button></div></div>
}
export function Modal({title, onClose, children}: {title: string; onClose: () => void; children: ReactNode}) {
 const ref = useRef<HTMLElement>(null), close = useRef(onClose); close.current = onClose
 useEffect(() => {
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
  return () => {document.removeEventListener('keydown', key); previous?.focus()}
 }, [])
 return <motion.div className="modal-overlay" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} onClick={e => {if (e.target === e.currentTarget) onClose()}}><motion.section ref={ref} className="modal" role="dialog" aria-modal="true" aria-label={title} initial={{opacity: 0, scale: .97, y: 12}} animate={{opacity: 1, scale: 1, y: 0}} exit={{opacity: 0, scale: .98}}><div className="row spread"><h2>{title}</h2><button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={20}/></button></div>{children}</motion.section></motion.div>
}
