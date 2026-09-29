import {describe, expect, it} from 'vitest'
import {questionSchema, type Answer, type Question, type SessionQuestion} from '../src/shared/schema'
import {correctAnswer, gradeQuestion, isAnswered} from '../src/shared/scoring'
const base = {id: 'q', prompt: 'Question', points: 4}
const options = [{id: 'a', text: 'A'}, {id: 'b', text: 'B'}, {id: 'c', text: 'C'}]
const item = (input: object): SessionQuestion => ({key: 'course/unit/quiz/q', quizKey: 'course/unit/quiz', quizTitle: 'Quiz', unitTitle: 'Unit', categoryTitle: 'Course', revision: 'revision', question: questionSchema.parse({...base, ...input})})
const grade = (input: object, answer: Answer, selfAssessment?: string[]) => gradeQuestion(item(input), {answer, timeMs: 0, selfAssessment})
describe('objective scoring', () => {
 it('scores single choice by ID', () => {expect(grade({type: 'single_choice', options, answer: 'b'}, 'b').earned).toBe(4); expect(grade({type: 'single_choice', options, answer: 'b'}, 'B').earned).toBe(0)})
 it('treats a false boolean as an answered question', () => {expect(isAnswered(false)).toBe(true); expect(grade({type: 'true_false', answer: false}, false).earned).toBe(4)})
 it('gives no points to an unanswered true/false question', () => {expect(grade({type: 'true_false', answer: false}, null).earned).toBe(0)})
 it('requires the exact set without partial credit', () => {expect(grade({type: 'multiple_choice', options, answer: ['a', 'b']}, ['b', 'a']).earned).toBe(4); expect(grade({type: 'multiple_choice', options, answer: ['a', 'b']}, ['a', 'b', 'c']).earned).toBe(0)})
 it('subtracts wrong selections and ignores duplicates for partial credit', () => {expect(grade({type: 'multiple_choice', options, answer: ['a', 'b'], partialCredit: true}, ['a', 'a']).earned).toBe(2); expect(grade({type: 'multiple_choice', options, answer: ['a', 'b'], partialCredit: true}, ['a', 'b', 'c']).earned).toBe(2)})
 it('clamps multiple-choice penalties at zero', () => {expect(grade({type: 'multiple_choice', options, answer: ['a'], partialCredit: true}, ['b', 'c']).earned).toBe(0)})
 it('scores ordering by position and rounds partial points', () => {expect(grade({type: 'ordering', options, answer: ['a', 'b', 'c'], partialCredit: true}, ['a', 'c', 'b']).earned).toBe(1.3333); expect(grade({type: 'ordering', options, answer: ['a', 'b', 'c']}, ['a', 'c', 'b']).earned).toBe(0)})
 it('scores matching independently of display ordering', () => {expect(grade({type: 'matching', pairs: [{id: 'a', left: 'A', right: '1'}, {id: 'b', left: 'B', right: '2'}], partialCredit: true}, {a: 'a', b: 'a'}).earned).toBe(2)})
 it('normalizes whitespace, case and Unicode for blank answers', () => {expect(grade({type: 'fill_blank', prompt: '{{a}} / {{b}}', blanks: [{id: 'a', answers: ['Key Vault']}, {id: 'b', answers: ['test']}], partialCredit: true}, {a: '  KEY   VAULT ', b: 'incorrect'}).earned).toBe(2)})
 it('honors case-sensitive short answers', () => {expect(grade({type: 'short_answer', answers: ['ABC'], caseSensitive: true}, 'abc').earned).toBe(0); expect(grade({type: 'short_answer', answers: ['ABC']}, '  abc ').earned).toBe(4)})
 it('safely scores blank IDs that coincide with object property names', () => {expect(grade({type: 'fill_blank', prompt: '{{constructor}}', blanks: [{id: 'constructor', answers: ['Answer']}]}, null).earned).toBe(0)})
 it('applies absolute numeric tolerance inclusively', () => {expect(grade({type: 'numeric', answer: 75, tolerance: .1}, 74.9).earned).toBe(4); expect(grade({type: 'numeric', answer: 75, tolerance: .1}, 74.89).earned).toBe(0)})
 it('counts numeric zero as an answer', () => {expect(isAnswered(0)).toBe(true); expect(grade({type: 'numeric', answer: 0}, 0).earned).toBe(4)})
})
describe('self-assessment', () => {
 const rubric = [{id: 'a', description: 'First criterion', points: 1}, {id: 'b', description: 'Second criterion', points: 3}]
 for (const type of ['written', 'code']) it(`awards ${type} criteria without duplicating points`, () => {expect(grade({type, rubric, modelAnswer: 'Model'}, 'My answer', ['a', 'a', 'unknown']).earned).toBe(1)})
 it('does not award criteria for an empty response', () => {expect(grade({type: 'written', rubric, modelAnswer: 'Model'}, ' ', ['a', 'b']).earned).toBe(0)})
})
describe('content contract', () => {
 it('rejects answers that reference missing options', () => {expect(() => item({type: 'single_choice', options, answer: 'missing'})).toThrow()})
 it('requires all ordering option IDs exactly once', () => {expect(() => item({type: 'ordering', options, answer: ['a', 'b']})).toThrow()})
 it('requires rubric points to equal the question weight', () => {expect(() => item({type: 'written', rubric: [{id: 'a', description: 'Criterion', points: 1}], modelAnswer: 'Model'})).toThrow()})
 it('requires a definition for each blank placeholder', () => {expect(() => item({type: 'fill_blank', prompt: '{{missing}}', blanks: [{id: 'a', answers: ['Answer']}]})).toThrow()})
 it('rejects unknown fields and unsafe precision', () => {expect(() => item({type: 'numeric', answer: 1, typo: true})).toThrow(); expect(() => item({type: 'numeric', answer: 1, points: .00001})).toThrow()})
})
