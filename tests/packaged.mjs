import {_electron as electron} from 'playwright'
import {execFileSync} from 'node:child_process'
import {mkdtemp, readFile, rm, access} from 'node:fs/promises'
import assert from 'node:assert/strict'
import os from 'node:os'
import path from 'node:path'

const root = await mkdtemp(path.join(os.tmpdir(), 'quizmeadow-packaged-'))
const archiveDirectory = path.resolve(process.argv[2] || 'release')
const architecture = process.arch === 'arm64' ? 'arm64' : 'x64'
const version = JSON.parse(await readFile('package.json', 'utf8')).version
const appDirectory = path.join(root, 'app')
const dataDirectory = path.join(root, 'data')
execFileSync('/usr/bin/ditto', ['-x', '-k', path.join(archiveDirectory, `QuizMeadow-mac-${architecture}.zip`), appDirectory])
const bundle = path.join(appDirectory, 'QuizMeadow.app')
execFileSync('/usr/bin/codesign', ['--verify', '--deep', '--strict', bundle])
let app
const errors = []
const launch = async () => {
  app = await electron.launch({executablePath: path.join(bundle, 'Contents/MacOS/QuizMeadow'), env: {...process.env, QUIZMEADOW_DATA_DIR: dataDirectory, QUIZMEADOW_LIBRARY_DIR: path.join(root, 'library')}, timeout: 30000})
  const page = await app.firstWindow()
  page.on('pageerror', error => errors.push(error.message))
  await page.getByRole('heading', {name: 'Make it stick.'}).waitFor()
  return page
}
try {
  let page = await launch()
  const security = await app.evaluate(({app, BrowserWindow}) => {
    const preferences = BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences()
    return {packaged: app.isPackaged, version: app.getVersion(), sandbox: preferences.sandbox, isolated: preferences.contextIsolation, node: preferences.nodeIntegration}
  })
  assert.deepEqual(security, {packaged: true, version, sandbox: true, isolated: true, node: false})
  const library = await page.evaluate(() => window.quizmeadow.bootstrap())
  assert.equal(library.attempts.length, 0)
  assert.equal(library.library.categories.length, 1)
  assert.equal(library.library.categories[0].title, 'Welcome to QuizMeadow')
  await access(path.join(library.library.root, 'WEB-AGENT-PROMPT.md'))
  assert.equal(await app.evaluate(({app}) => app.getPath('userData')), dataDirectory)
  assert.equal(library.library.issues.length, 0)
  const quizzes = library.library.categories.flatMap(category => category.units.flatMap(unit => unit.quizzes))
  assert.equal(quizzes.length, 1)
  assert.equal(quizzes[0].questions.length, 10)
  await page.evaluate(() => document.fonts.ready)
  assert.equal(await page.evaluate(() => document.fonts.check('18px Barlow') && document.fonts.check('600 32px "Barlow Condensed"')), true)
  await page.waitForFunction(() => [...document.querySelectorAll('.brand-mark img')].every(image => image.complete && image.naturalWidth > 0))
  await page.getByRole('button', {name: 'Start a session', exact: true}).click()
  await page.getByRole('button', {name: 'Begin session', exact: true}).click()
  await page.locator('.answer-option').filter({has: page.getByText('Four', {exact: true})}).click()
  await page.getByRole('button', {name: 'Check answer', exact: true}).click()
  await page.getByRole('button', {name: 'Save & exit', exact: true}).click()
  await page.locator('.player').waitFor({state: 'hidden'})
  const saved = JSON.parse(await readFile(path.join(dataDirectory, 'session.json'), 'utf8')).data
  assert.equal(saved.responses[saved.questions[0].key].answer, 'four')
  assert.equal(saved.responses[saved.questions[0].key].checked, true)
  await app.close(); app = undefined
  page = await launch()
  await page.locator('.resume-banner').click()
  await page.locator('.answer-option.selected').filter({has: page.getByText('Four', {exact: true})}).waitFor()
  assert.equal(await page.locator('.answer-option.selected input').isDisabled(), true)
  await page.getByRole('button', {name: 'Next question', exact: true}).click()
  await page.locator('.answer-option').first().click()
  await app.close(); app = undefined
  const onQuit = JSON.parse(await readFile(path.join(dataDirectory, 'session.json'), 'utf8')).data
  assert.equal(onQuit.currentIndex, 1)
  assert.equal(onQuit.responses[onQuit.questions[1].key].answer.length, 1)
  assert.deepEqual(errors, [])
  console.log(`Packaged ${architecture} app passed: intact extracted bundle, secure renderer, bundled tour and fonts, quiz scoring, and saved response after restart, and save-on-quit.`)
} finally {
  if (app) await app.close()
  await rm(root, {recursive: true, force: true})
}
