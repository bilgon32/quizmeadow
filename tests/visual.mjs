import {_electron as electron} from 'playwright'
import assert from 'node:assert/strict'
import {mkdtemp, cp} from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'

const root = await mkdtemp(path.join(os.tmpdir(), 'quizmeadow-visual-'))
const library = path.join(root, 'library')
await cp('library', library, {recursive: true})
const app = await electron.launch({args: ['.'], env: {...process.env, QUIZMEADOW_DATA_DIR: path.join(root, 'data'), QUIZMEADOW_LIBRARY_DIR: library}})
try {
  const page = await app.firstWindow()
  const errors = []
  let stableHeader
  const frames = new Map()
  page.on('pageerror', error => errors.push(error.message))
  await page.getByRole('heading', {name: 'Make it stick.'}).waitFor()
  await page.evaluate(() => document.fonts.ready)
  assert.equal(await page.locator('.question-prompt').count(), 0)
  const inspect = async name => {
    await page.waitForTimeout(250)
    await page.evaluate(() => Promise.all(document.getAnimations().filter(a => a.effect?.getTiming().iterations !== Infinity).map(a => a.finished.catch(() => {}))))
    const problems = await page.evaluate(() => {
      const result = []
      for (const el of document.querySelectorAll('.workspace,.page-scroll,.player-body,.modal,.topbar')) {
        if (el.getBoundingClientRect().width && el.scrollWidth > el.clientWidth + 1) result.push(`Overflow: ${el.className} ${el.scrollWidth}/${el.clientWidth}`)
      }
      const rgb = value => (value.match(/[\d.]+/g) || []).map(Number)
      const luminance = color => color.slice(0, 3).map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0)
      const background = el => {
        let value = [0, 0, 0]
        const ancestors = []
        for (let node = el; node; node = node.parentElement) ancestors.unshift(node)
        for (const node of ancestors) {
          const color = rgb(getComputedStyle(node).backgroundColor)
          const alpha = color.length === 4 ? color[3] : 1
          value = value.map((v, i) => color[i] * alpha + v * (1 - alpha))
        }
        return value
      }
      for (const el of document.querySelectorAll('.page-heading p,.topbar-path,.sidebar nav button,.pill,.answer-option,.question-prompt .markdown,.confidence-buttons button,.button.primary,.mode-selector span,.callout,.bgp-card-head,.stat-card p,.stat-card>.row,.settings-info,.timer,.topbar-actions>.tiny,.practice-feedback>.row,.practice-feedback>.markdown,.grading-answer .eyebrow')) {
        if (!el.getBoundingClientRect().width || el.matches(':disabled')) continue
        const foreground = luminance(rgb(getComputedStyle(el).color)), back = luminance(background(el))
        const ratio = (Math.max(foreground, back) + .05) / (Math.min(foreground, back) + .05)
        if (ratio < 4.5) result.push(`Contrast ${ratio.toFixed(2)}: ${el.className} ${el.textContent.slice(0, 32)}`)
      }
      for (const el of document.querySelectorAll('.button,.icon-button,.answer-option,.confidence-buttons button')) {
        const box = el.getBoundingClientRect()
        if (box.width && box.height < 48) result.push(`Small target: ${el.className} ${box.height}`)
      }
      return result
    })
    await page.screenshot({path: path.join(root, `${name}.png`), scale: 'css'})
    if (problems.length) console.log(await page.evaluate(() => [...document.querySelectorAll('.page-scroll *')].map(el => ({name: el.className, text: el.textContent.slice(0, 45), right: el.getBoundingClientRect().right, width: el.getBoundingClientRect().width})).filter(el => el.right > innerWidth + 1).slice(0, 10)))
    assert.deepEqual(problems, [], name)
  }
  for (const theme of ['dark', 'light']) {
    await page.getByRole('button', {name: 'Settings & data', exact: true}).click()
    await page.getByLabel('Appearance', {exact: true}).selectOption(theme)
    await page.waitForFunction(theme => document.documentElement.dataset.theme === theme, theme)
    for (const width of [1380, 960, 320]) {
      await app.evaluate(({BrowserWindow}, width) => {const window = BrowserWindow.getAllWindows()[0]; window.setMinimumSize(320, 700); window.setSize(width, 940)}, width)
      for (const view of ['Today', 'Library', 'Review', 'History', 'Settings & data']) {
        await page.getByRole('button', {name: view, exact: true}).click()
        await inspect(`${theme}-${width}-${view.replaceAll(' ', '-')}`)
        const frame = await page.evaluate(() => {const title = document.querySelector('.page-heading h1').getBoundingClientRect(); const page = document.querySelector('.page').getBoundingClientRect(); const header = getComputedStyle(document.querySelector('.topbar')); return {left: title.left, top: title.top, inset: title.left - page.left, header: header.backgroundColor}})
        if (!stableHeader) stableHeader = frame.header
        assert.equal(frame.header, stableHeader, 'Identity header stays dark in both themes')
        const key = `${theme}-${width}`
        const baseline = frames.get(key)
        if (baseline) {assert.equal(frame.left, baseline.left, 'Routes share the left edge'); assert.equal(frame.top, baseline.top, 'Routes share the title baseline')} else frames.set(key, frame)
        assert.equal(frame.inset, width <= 760 ? 20 : 32, 'Shared frame gutters')
      }
    }
    await app.evaluate(({BrowserWindow}) => BrowserWindow.getAllWindows()[0].setSize(1380, 940))
    await page.evaluate(() => document.documentElement.style.fontSize = '32px')
    for (const view of ['Today', 'Library', 'Review', 'History', 'Settings & data']) {await page.getByRole('button', {name: view, exact: true}).click(); await inspect(`${theme}-text-200-${view.replaceAll(' ', '-')}`)}
    await page.evaluate(() => document.documentElement.style.fontSize = '')
    await app.evaluate(({BrowserWindow}) => BrowserWindow.getAllWindows()[0].webContents.setZoomFactor(2))
    for (const view of ['Today', 'Library', 'Settings & data']) {await page.getByRole('button', {name: view, exact: true}).click(); await inspect(`${theme}-zoom-200-${view.replaceAll(' ', '-')}`)}
    await app.evaluate(({BrowserWindow}) => {const win = BrowserWindow.getAllWindows()[0]; win.webContents.setZoomFactor(1); win.setSize(960, 940)})
    await page.getByRole('button', {name: 'Library', exact: true}).click()
    await page.getByRole('button', {name: 'Start quiz', exact: true}).click()
    await inspect(`${theme}-setup`)
    // The modal restores focus and keeps keyboard navigation within the dialog.
    await page.keyboard.press('Tab')
    assert.equal(await page.evaluate(() => !!document.activeElement?.closest('[role=dialog]')), true)
    const trigger = page.getByRole('button', {name: 'Start quiz', exact: true})
    await page.keyboard.press('Escape')
    assert.equal(await trigger.evaluate(el => el === document.activeElement), true, 'Dialog returns focus')
    await trigger.click()
    await page.getByRole('button', {name: 'Begin session', exact: true}).click()
    await page.locator('.modal').waitFor({state: 'hidden'})
    await page.getByRole('radio', {name: 'Four', exact: true}).focus()
    await page.keyboard.press('Space')
    assert.equal(await page.getByRole('radio', {name: 'Four', exact: true}).isChecked(), true, 'Native choice keyboard path')
    await page.getByRole('button', {name: 'Confident', exact: true}).click()
    for (let index = 0; index < 10; index++) {
      await inspect(`${theme}-question-${index + 1}`)
      if (index === 0) {await page.getByRole('button', {name: 'Check answer', exact: true}).click(); await inspect(`${theme}-checked-answer`)}
      if (index < 9) await page.getByRole('button', {name: 'Next question', exact: true}).click()
    }
    await page.getByRole('button', {name: 'Save & exit', exact: true}).click()
    await page.getByRole('button', {name: 'Settings & data', exact: true}).click()
    await page.getByRole('button', {name: 'Discard saved session', exact: true}).click()
    await page.getByRole('button', {name: 'Discard session', exact: true}).click()
  }
  await app.evaluate(({BrowserWindow}) => BrowserWindow.getAllWindows()[0].setSize(1380, 940))
  await page.getByRole('button', {name: 'Library', exact: true}).click()
  await page.getByRole('button', {name: 'Build mixed session', exact: true}).click()
  await page.getByRole('button', {name: 'Clear all', exact: true}).click()
  await page.getByRole('status').filter({hasText: 'Action needed'}).waitFor()
  assert.equal(await page.getByRole('button', {name: 'Begin session', exact: true}).isDisabled(), true)
  await inspect('prerequisite')
  const summary = page.locator('.setup-selection summary').first()
  await summary.click()
  await summary.click()
  await page.emulateMedia({reducedMotion: 'reduce'})
  await page.waitForTimeout(50)
  assert.equal(await page.locator('.setup-selection .bgp-disclosure-body').first().evaluate(el => el.getAnimations().length), 0, 'Preference change interrupts disclosure')
  await page.keyboard.press('Escape')
  await page.emulateMedia({reducedMotion: 'no-preference'})
  await page.getByRole('button', {name: 'Settings & data', exact: true}).click()
  await page.getByLabel('Reduce motion', {exact: true}).check()
  await page.waitForFunction(() => document.documentElement.dataset.motion === 'reduced')
  assert.equal(await page.evaluate(() => document.getAnimations().length), 0, 'Local preference commits final animation state')
  await page.getByRole('button', {name: 'Today', exact: true}).click()
  await page.getByRole('button', {name: 'Start a session', exact: true}).click()
  await page.getByRole('spinbutton').first().fill('1')
  await page.getByRole('button', {name: 'Begin session', exact: true}).click()
  await page.getByRole('radio', {name: 'Five', exact: true}).focus(); await page.keyboard.press('Space')
  await page.getByRole('button', {name: 'Bookmark question', exact: true}).click()
  await page.getByRole('button', {name: 'Check answer', exact: true}).click()
  await inspect('incorrect-feedback')
  await page.getByRole('button', {name: 'Finish session', exact: true}).click()
  await page.getByRole('button', {name: 'Submit answers', exact: true}).click()
  await page.getByRole('heading', {name: 'Now you know where to focus.'}).waitFor()
  for (const theme of ['light','dark']) {
    await page.getByRole('button', {name: 'Settings & data', exact: true}).click()
    await page.getByLabel('Appearance', {exact: true}).selectOption(theme)
    await page.getByRole('button', {name: 'History', exact: true}).click()
    await inspect(`${theme}-populated-history`)
    await page.locator('.history-row').first().click()
    await inspect(`${theme}-result`)
    await page.getByRole('button', {name: 'Review', exact: true}).click()
    await inspect(`${theme}-populated-review`)
    await page.locator('.review-question').first().click()
    await inspect(`${theme}-review-disclosure`)
    // Closing through the control is focus-safe and preserves the reviewing context.
    await page.locator('.review-question').first().click()
    assert.equal(await page.locator('.review-question').first().evaluate(el => el === document.activeElement), true)
  }
  await page.getByRole('button', {name: 'Today', exact: true}).click()
  await page.emulateMedia({reducedMotion: 'reduce'})
  await page.locator('.skip-link').focus()
  assert.equal(await page.locator('.skip-link').evaluate(el => getComputedStyle(el).outlineWidth), '3px')
  await page.keyboard.press('Enter')
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'main-content')
  assert.equal(await page.locator('.button.primary').evaluate(el => parseFloat(getComputedStyle(el).transitionDuration)), 0)
  assert.deepEqual(errors, [])
  console.log(`Visual checks passed: shared frame and header, all five routes, text/zoom 200%, native keyboard choices, local/OS interrupted motion, reversible disclosures, prerequisites, populated history/review/results; both themes, 1380/960/320 px, all ten formats, contrast, targets, modal keyboard focus and reduced motion. Screenshots: ${root}`)
} finally {await app.close()}
