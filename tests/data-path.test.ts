import {afterEach, beforeEach, describe, expect, it} from 'vitest'
import {mkdtemp, mkdir, cp, readFile, writeFile, rm} from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import {resolveDataPath} from '../src/main/data-path'
import {Engine} from '../src/main/engine'
import {Storage} from '../src/main/storage'
import {allQuizzes} from '../src/shared/study'

let root: string, legacy: string, current: string
beforeEach(async () => {root = await mkdtemp(path.join(os.tmpdir(), 'quizmeadow-upgrade-')); legacy = path.join(root, 'recall-study'); current = path.join(root, 'quizmeadow')})
afterEach(async () => {await rm(root, {recursive: true, force: true})})
describe('pre-release data discovery', () => {
 it('uses the current folder for a new installation', () => {expect(resolveDataPath(root, current)).toBe(current)})
 it('ignores an old folder that contains only Electron caches', async () => {await mkdir(path.join(legacy, 'Cache'), {recursive: true}); expect(resolveDataPath(root, current)).toBe(current)})
 it.each(['settings.json', 'session.json', 'reviews.json', 'library', 'attempts'])('finds existing study data via %s without requiring settings', async marker => {
  await mkdir(legacy, {recursive: true})
  if (marker.endsWith('.json')) await writeFile(path.join(legacy, marker), '{}')
  else await mkdir(path.join(legacy, marker))
  expect(resolveDataPath(root, current)).toBe(legacy)
 })
 it('keeps an explicit data override isolated from an old installation', async () => {await mkdir(path.join(legacy, 'library'), {recursive: true}); const isolated = path.join(root, 'test-profile'); expect(resolveDataPath(root, current, isolated)).toBe(isolated)})
 it('restores a completed attempt when no settings file was ever saved', async () => {
  const library = path.join(legacy, 'library'); await cp('library', library, {recursive: true})
  const original = new Engine(new Storage(legacy), library, 'pre-release'); await original.initialize()
  const quiz = allQuizzes((await original.bootstrap()).library)[0]
  const session = await original.start({quizKeys: [quiz.key], mode: 'exam', source: 'quiz', count: 1, shuffle: false})
  session.responses[session.questions[0].key] = {answer: 'four', timeMs: 1000}
  const attempt = await original.finish(session)
  await expect(readFile(path.join(legacy, 'settings.json'))).rejects.toMatchObject({code: 'ENOENT'})
  const file = path.join(legacy, 'attempts', `${attempt.id}.json`), before = await readFile(file, 'utf8')
  const restoredRoot = resolveDataPath(root, current)
  const updated = new Engine(new Storage(restoredRoot), path.join(restoredRoot, 'library'), '1.0.1'); await updated.initialize()
  expect((await updated.bootstrap()).attempts).toEqual([attempt])
  expect(await readFile(file, 'utf8')).toBe(before)
 })
})
