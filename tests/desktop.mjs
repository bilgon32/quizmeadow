import {_electron as electron} from 'playwright'
import assert from 'node:assert/strict'
import {mkdtemp, mkdir, cp, readFile, readdir, writeFile} from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
const root = await mkdtemp(path.join(os.tmpdir(), 'quizmeadow-desktop-'))
const dataDir = path.join(root, 'data'), library = path.join(root, 'library')
await cp('library', library, {recursive: true})
await cp('tests/fixtures/library', library, {recursive: true})
let app, page
const errors = []
const launch = async () => {
 app = await electron.launch({args: ['.'], env: {...process.env, QUIZMEADOW_DATA_DIR: dataDir, QUIZMEADOW_LIBRARY_DIR: library}, timeout: 30000})
 page = await app.firstWindow(); page.on('pageerror', e => errors.push(e.message)); await page.getByRole('heading', {name: 'Make it stick.'}).waitFor()
}
try {
 await launch()
 await page.waitForTimeout(350); await page.screenshot({path: '/private/tmp/quizmeadow-dashboard.png'})
 await page.getByRole('button', {name: 'Library', exact: true}).click()
 await page.locator('.quiz-card').filter({hasText: 'A little tour of QuizMeadow'}).getByRole('button', {name: 'Start quiz'}).click()
 await page.getByRole('button', {name: /^Exam/}).click()
 await page.getByRole('button', {name: 'Begin session'}).click()
 await page.locator('.answer-option').filter({has: page.getByText('Four', {exact: true})}).click()
 await page.getByRole('button', {name: 'Confident', exact: true}).click()
 assert.equal(await page.getByRole('button', {name: 'Check answer', exact: true}).count(), 0)
 await page.waitForTimeout(350); await page.screenshot({path: '/private/tmp/quizmeadow-question.png'})
 await page.getByRole('button', {name: 'Save & exit'}).click()
 const beforeRestart = JSON.parse(await readFile(path.join(dataDir, 'session.json'), 'utf8')).data
 await app.close(); await launch()
 await page.locator('.resume-banner').click()
 const afterRestart = JSON.parse(await readFile(path.join(dataDir, 'session.json'), 'utf8')).data
 assert.deepEqual(afterRestart.questions, beforeRestart.questions)
 assert.equal(afterRestart.responses[afterRestart.questions[0].key].answer, 'four')
 const next = async () => {const previous = await page.locator('[data-question-key]').getAttribute('data-question-key'); await page.getByRole('button', {name: 'Next question', exact: true}).click(); await page.waitForFunction(previous => {const key = document.querySelector('[data-question-key]')?.getAttribute('data-question-key'); return !!key && key !== previous}, previous)}
 await next()
 for (const n of ['2', '3', '5']) await page.locator('.answer-option').filter({has: page.getByText(n, {exact: true})}).click()
 await next(); await page.getByRole('button', {name: 'False', exact: true}).click()
 await next()
 for (let target = 0; target < 3; target++) {
  const desired = ['1', '5', '10'][target]
  let values = await page.locator('.ordering-row .markdown').allTextContents()
  while (values.indexOf(desired) > target) {
   const position = values.indexOf(desired)
   await page.getByRole('button', {name: `Move item ${position + 1} up`, exact: true}).click()
   values = await page.locator('.ordering-row .markdown').allTextContents()
  }
 }
 if (await page.getByRole('button', {name: 'Use this order'}).count()) await page.getByRole('button', {name: 'Use this order'}).click()
 await next()
 for (const [label, value] of [['Addition', 'addition'], ['Subtraction', 'subtraction'], ['Multiplication', 'multiplication']]) await page.getByLabel(`Match ${label}`, {exact: true}).selectOption(value)
 await next(); await page.getByLabel('sides', {exact: true}).fill('three'); await page.getByLabel('corners', {exact: true}).fill('4')
 await next(); await page.getByLabel('Your answer (%)', {exact: true}).fill('75')
 await next(); await page.getByLabel('Your answer', {exact: true}).fill('January')
 await next(); await page.getByLabel('Your explanation', {exact: true}).fill('Trying to remember exposes gaps. I can close my notes and explain a new word before checking it.')
 await next(); await page.getByLabel('Your solution · text', {exact: true}).fill('Apples\nBread\nRice')
 await page.getByRole('button', {name: 'Finish session', exact: true}).click()
 await page.getByRole('button', {name: 'Submit answers', exact: true}).click()
 await page.locator('.rubric-row input').first().waitFor()
 for (const box of await page.locator('.rubric-row input').all()) await box.check()
 await page.getByRole('button', {name: 'Confirm my self-assessment', exact: true}).click()
 await page.getByRole('button', {name: 'Next response', exact: true}).click(); await page.locator('.question-prompt').filter({hasText: 'Write a shopping list'}).waitFor()
 for (const box of await page.locator('.rubric-row input').all()) await box.check()
 await page.getByRole('button', {name: 'Confirm my self-assessment', exact: true}).click()
 await page.getByRole('button', {name: 'Finish & see results', exact: true}).click()
 await page.getByRole('heading', {name: 'Good work. Keep it growing.'}).waitFor()
 const files = await readdir(path.join(dataDir, 'attempts'))
 assert.equal(files.length, 1)
 const attempt = JSON.parse(await readFile(path.join(dataDir, 'attempts', files[0]), 'utf8')).data
 assert.equal(attempt.percent, 100); assert.equal(attempt.earned, 27); assert.equal(attempt.grades.length, 10)
 assert.equal(attempt.grades.filter(g => g.grading === 'self').length, 2)
 assert.ok(attempt.libraryRoot); assert.ok(attempt.timezone)
 await page.waitForTimeout(350); await page.screenshot({path: '/private/tmp/quizmeadow-result.png'})
 await page.getByRole('button', {name: 'Settings & data', exact: true}).click()
 await page.getByLabel('Appearance', {exact: true}).selectOption('dark')
 await page.getByRole('button', {name: 'Library', exact: true}).click()
 assert.equal(await page.getByRole('heading', {name: 'Your library.'}).evaluate(el => getComputedStyle(el).color), 'rgb(238, 234, 247)'); await page.waitForTimeout(350); await page.screenshot({path: '/private/tmp/quizmeadow-library-dark.png'})
 await page.getByRole('button', {name: 'Settings & data', exact: true}).click()
 for (const [format, extension] of [['JSON', 'json'], ['CSV', 'csv'], ['Markdown', 'md']]) {
  const output = path.join(root, `export.${extension}`)
  await app.evaluate(({dialog}, output) => {dialog.showSaveDialog = async () => ({canceled: false, filePath: output})}, output)
  await page.getByRole('button', {name: format, exact: true}).click()
  await page.getByRole('status').filter({hasText: 'Exported to'}).waitFor()
  const contents = await readFile(output, 'utf8'); assert.ok(contents.includes(format === 'CSV' ? 'quiz_revision' : format === 'JSON' ? 'completedAt' : 'QuizMeadow study attempts'))
  await page.getByRole('button', {name: 'Dismiss notification', exact: true}).click()
 }
 await writeFile(path.join(library, 'question-lab/01-formats/broken.yaml'), 'bad: [')
 await page.getByRole('button', {name: 'Library', exact: true}).click()
 await page.getByText(/library file needs attention/).waitFor()
 assert.deepEqual(JSON.parse(await readFile(path.join(dataDir, 'attempts', files[0]), 'utf8')).data, attempt)
 await page.locator('.quiz-card').filter({hasText: 'A little world knowledge'}).getByRole('button', {name: 'Start quiz'}).click()
 await page.getByRole('spinbutton').first().fill('1')
 await page.getByRole('button', {name: 'Begin session'}).click()
 await page.locator('.answer-option').filter({hasText: 'Rome'}).click()
 await page.getByRole('button', {name: 'Bookmark question', exact: true}).click()
 await page.getByRole('button', {name: 'Check answer', exact: true}).click()
 assert.ok(await page.locator('.answer-option').first().isDisabled())
 await page.getByRole('button', {name: 'Finish session', exact: true}).click()
 await page.getByRole('button', {name: 'Submit answers', exact: true}).click()
 await page.getByRole('heading', {name: 'Now you know where to focus.'}).waitFor()
 await page.getByRole('button', {name: 'Review', exact: true}).click()
 assert.equal(await page.locator('.review-item').count(), 1)
 await page.getByRole('button', {name: 'Practice 1 questions'}).click()
 await page.getByRole('button', {name: 'Begin session'}).click()
 await page.locator('.answer-option').filter({hasText: 'Paris'}).click()
 await page.getByRole('button', {name: 'Finish session', exact: true}).click()
 await page.getByRole('button', {name: 'Submit answers', exact: true}).click()
 await page.getByRole('heading', {name: 'Good work. Keep it growing.'}).waitFor()
 await page.getByRole('button', {name: 'Library', exact: true}).click()
 await page.getByRole('button', {name: 'Build mixed session'}).click()
 await page.getByRole('spinbutton').first().fill('5')
 await page.getByLabel('Shuffle question order', {exact: true}).uncheck()
 await page.getByRole('button', {name: 'Begin session'}).click()
 await page.locator('.answer-option').filter({hasText: 'Paris'}).click()
 await app.close()
 const closedSession = JSON.parse(await readFile(path.join(dataDir, 'session.json'), 'utf8')).data
 assert.equal(closedSession.responses[closedSession.questions[0].key].answer, 'paris')
 assert.equal(closedSession.source, 'mixed'); assert.equal(closedSession.questions.length, 5)
 await launch(); await page.locator('.resume-banner').click()
 assert.ok((await page.locator('.answer-option').filter({hasText: 'Paris'}).getAttribute('class')).includes('selected'))
 await page.getByRole('button', {name: 'Save & exit'}).click()
 await page.getByRole('button', {name: 'Settings & data', exact: true}).click()
 await page.getByRole('button', {name: 'Discard saved session', exact: true}).click()
 await page.getByRole('button', {name: 'Discard session', exact: true}).click()
 await page.getByRole('button', {name: 'Today', exact: true}).click()
 await page.evaluate(async () => {
  const data = await window.quizmeadow.bootstrap(), quiz = data.library.categories[0].units[0].quizzes[0]
  await window.quizmeadow.start({quizKeys: [quiz.key], mode: 'exam', source: 'quiz', count: 1, shuffle: false, timeLimitMinutes: .05})
 })
 await page.getByRole('button', {name: 'Refresh library', exact: true}).click()
 await page.locator('.resume-banner').click()
 await page.locator('.answer-option').filter({hasText: 'Paris'}).click()
 await page.getByRole('heading', {name: 'Good work. Keep it growing.'}).waitFor()
 const completed = JSON.parse(await readFile(path.join(dataDir, 'session.json'), 'utf8')).data
 assert.equal(completed, null)

 assert.equal(errors.length, 0)
 console.log(`Desktop flow passed: all 10 types, exam feedback, restart/resume, weighted scoring, self-assessment, exports, practice feedback locking, bookmarks, mistake review, mixed selection, save-on-quit, timed auto-submit, invalid-file isolation. Data: ${root}`)
} catch(error) {if (page) await page.screenshot({path: '/private/tmp/quizmeadow-failure.png'}).catch(() => {}); throw error} finally {if (app) await app.close()}
