import {app, BrowserWindow, ipcMain, dialog, shell, Menu} from 'electron'
import path from 'node:path'
import {mkdir, cp, access, writeFile, realpath} from 'node:fs/promises'
import {watch, mkdirSync, type FSWatcher} from 'node:fs'
import {Engine} from './engine'
import {Storage} from './storage'
import {resolveDataPath} from './data-path'
import {answerLabel} from '../shared/scoring'
import type {Session, SessionConfig, Settings} from '../shared/schema'

let window: BrowserWindow | null = null, engine: Engine, watcher: FSWatcher | undefined, debounce: ReturnType<typeof setTimeout>
let queue: Promise<unknown> = Promise.resolve()
let quitting = false
const mutate = <T>(fn: () => Promise<T>): Promise<T> => {const result = queue.then(fn); queue = result.catch(() => {}); return result}
function watchLibrary(root: string) {
 watcher?.close()
 try {watcher = watch(root, {recursive: true}, () => {clearTimeout(debounce); debounce = setTimeout(() => {void mutate(async () => {await engine.refresh(); window?.webContents.send('library:changed')}).catch(() => {})}, 500)})} catch { /* Refresh remains available for inaccessible folders. */ }
}
function createWindow() {
 window = new BrowserWindow({width: 1380, height: 940, minWidth: 960, minHeight: 700, backgroundColor: '#101925', title: 'QuizMeadow', titleBarStyle: 'hiddenInset', trafficLightPosition: {x: 22, y: 22}, show: false, webPreferences: {preload: path.join(__dirname, '../preload/index.js'), contextIsolation: true, nodeIntegration: false, sandbox: true}})
 const win = window
 let closeAllowed = false, waitingForSave = false, closeTimeout: ReturnType<typeof setTimeout>
 const ready = (event: Electron.IpcMainEvent) => {
  if (event.sender !== win.webContents) return
  clearTimeout(closeTimeout); closeAllowed = true
  void queue.finally(() => {if (quitting) app.quit(); else win.close()})
 }
 const failed = (event: Electron.IpcMainEvent, message: string) => {
  if (event.sender !== win.webContents) return
  clearTimeout(closeTimeout); waitingForSave = false; quitting = false
  dialog.showErrorBox('Your session could not be saved', String(message).slice(0, 1000))
 }
 ipcMain.on('app:close-ready', ready); ipcMain.on('app:close-failed', failed)
 win.on('close', event => {
  if (closeAllowed || win.webContents.isDestroyed()) return
  event.preventDefault()
  if (waitingForSave) return
  waitingForSave = true; win.webContents.send('app:prepare-close')
  closeTimeout = setTimeout(() => {waitingForSave = false; quitting = false; dialog.showErrorBox('QuizMeadow is still saving', 'The window has stayed open to preserve your work. Try Save & exit, then close again.')}, 10000)
 })
 win.on('closed', () => {clearTimeout(closeTimeout); ipcMain.removeListener('app:close-ready', ready); ipcMain.removeListener('app:close-failed', failed)})
 window.once('ready-to-show', () => window?.show())
 window.webContents.setWindowOpenHandler(() => ({action: 'deny'}))
 window.webContents.on('will-navigate', (event) => event.preventDefault())
 if (process.env.ELECTRON_RENDERER_URL) void window.loadURL(process.env.ELECTRON_RENDERER_URL)
 else void window.loadFile(path.join(__dirname, '../renderer/index.html'))
 window.on('closed', () => {window = null})
}
// Preserve the pre-release app's local history and selected library after rebranding.
const dataPath = resolveDataPath(app.getPath('appData'), app.getPath('userData'), process.env.QUIZMEADOW_DATA_DIR || process.env.RECALL_DATA_DIR)
mkdirSync(dataPath, {recursive: true})
app.setPath('userData', dataPath)
if (!app.requestSingleInstanceLock()) app.quit()
else {
 app.on('second-instance', () => {window?.show(); window?.focus()})
 app.whenReady().then(async () => {
  const defaultLibrary = process.env.QUIZMEADOW_LIBRARY_DIR || process.env.RECALL_LIBRARY_DIR || path.join(dataPath, 'library')
  try {await access(defaultLibrary)} catch {
   await mkdir(defaultLibrary, {recursive: true})
   await cp(app.isPackaged ? path.join(process.resourcesPath, 'starter-library') : path.join(app.getAppPath(), 'library'), defaultLibrary, {recursive: true})
  }
  engine = new Engine(new Storage(dataPath), defaultLibrary, app.getVersion()); await engine.initialize()
  const handle = (channel: string, fn: (...args: any[]) => Promise<unknown>) => ipcMain.handle(channel, (event, ...args) => {
   if (event.sender !== window?.webContents || event.senderFrame !== window.webContents.mainFrame) throw new Error('Unsupported sender')
   return mutate(() => fn(...args))
  })
  handle('bootstrap', () => engine.bootstrap()); handle('refresh', () => engine.refresh())
  handle('choose-library', async () => {
   const choice = await dialog.showOpenDialog(window!, {properties: ['openDirectory'], title: 'Choose your study library', buttonLabel: 'Use this library'})
   if (choice.canceled) return null
   const root = await realpath(choice.filePaths[0]); await engine.updateSettings({libraryRoot: root}); watchLibrary(root); return engine.bootstrap()
  })
  handle('start', (config: SessionConfig) => engine.start(config)); handle('save', async (session: Session) => {await engine.save(session)})
  handle('discard', async (id: string) => {await engine.discard(id)})
  handle('finish', (session: Session) => engine.finish(session))
  handle('settings', async (patch: Partial<Settings>) => {
   if (patch.libraryRoot !== undefined) throw new Error('Use the folder picker to change your library')
   return engine.updateSettings(patch)
  })
  handle('reveal-library', async () => {const data = await engine.bootstrap(); const error = await shell.openPath(data.library.root); if (error) throw new Error(error)})
  handle('reveal-data', async () => {const error = await shell.openPath(dataPath); if (error) throw new Error(error)})
  handle('open-source', async (url: string) => {const parsed = new URL(url); if (!['https:', 'http:'].includes(parsed.protocol)) throw new Error('Only web source links are supported'); await shell.openExternal(parsed.href)})
  handle('export', async (format: string) => {
   if (!['json', 'csv', 'markdown'].includes(format)) throw new Error('Unsupported export format')
   const {attempts} = await engine.bootstrap(), extension = format === 'markdown' ? 'md' : format
   const result = await dialog.showSaveDialog(window!, {defaultPath: `QuizMeadow-attempts-${new Date().toISOString().slice(0, 10)}.${extension}`, filters: [{name: format.toUpperCase(), extensions: [extension]}]})
   if (result.canceled || !result.filePath) return null
   let content = JSON.stringify({schemaVersion: 1, exportedAt: new Date().toISOString(), attempts}, null, 2)
   if (format === 'csv') {
    const rows: unknown[][] = [['attempt_id', 'title', 'mode', 'completed_at', 'earned', 'possible', 'percent', 'passed', 'elapsed_seconds', 'question_key', 'question_type', 'question_points', 'question_earned', 'answer', 'confidence', 'quiz_revision', 'grading']]
    attempts.forEach(a => a.questions.forEach((q, i) => rows.push([a.id, a.title, a.mode, a.completedAt, a.earned, a.possible, a.percent, a.passed, Math.round(a.elapsedMs / 1000), q.key, q.question.type, q.question.points, a.grades[i].earned, answerLabel(q.question, a.responses[q.key]?.answer), a.responses[q.key]?.confidence ?? '', q.revision, a.grades[i].grading])))
    content = rows.map(row => row.map(v => {let s = String(v); if (/^[=+@-]/.test(s)) s = `'${s}`; return `"${s.replace(/"/g, '""')}"`}).join(',')).join('\r\n')
   }
   if (format === 'markdown') content = '# QuizMeadow study attempts\n\n' + attempts.map(a => `## ${a.title.replace(/[\r\n]/g, ' ')}\n\n- Completed: ${a.completedAt}\n- Score: ${a.earned}/${a.possible} (${a.percent.toFixed(1)}%)\n- Mode: ${a.mode}\n- Duration: ${Math.round(a.elapsedMs / 60000)} minutes\n- Result: ${a.passed ? 'Pass' : 'Keep practicing'}\n\n` + a.questions.map((q, i) => `### ${q.question.prompt.replace(/[\r\n]/g, ' ')}\n\n- Points: ${a.grades[i].earned}/${q.question.points}\n- Grading: ${a.grades[i].grading}\n- Unit: ${q.unitTitle}\n- Confidence: ${a.responses[q.key]?.confidence ?? 'Unrecorded'}\n\nYour answer:\n\n${answerLabel(q.question, a.responses[q.key]?.answer)}\n\n${q.question.explanation}\n`).join('\n')).join('\n')
   await writeFile(result.filePath, content, 'utf8'); return result.filePath
  })
  Menu.setApplicationMenu(Menu.buildFromTemplate([{label: 'QuizMeadow', submenu: [{role: 'about'}, {type: 'separator'}, {role: 'hide'}, {role: 'hideOthers'}, {role: 'unhide'}, {type: 'separator'}, {role: 'quit'}]}, {label: 'Edit', submenu: [{role: 'undo'}, {role: 'redo'}, {type: 'separator'}, {role: 'cut'}, {role: 'copy'}, {role: 'paste'}, {role: 'selectAll'}]}, {label: 'View', submenu: [{role: 'resetZoom'}, {role: 'zoomIn'}, {role: 'zoomOut'}, {type: 'separator'}, {role: 'togglefullscreen'}, ...(!app.isPackaged ? [{role: 'toggleDevTools' as const}] : [])]}]))
  watchLibrary((await engine.bootstrap()).library.root); createWindow()
  app.on('activate', () => {if (!window) createWindow()})
 }).catch(err => {dialog.showErrorBox('QuizMeadow could not start', String(err)); app.quit()})
 app.on('window-all-closed', () => {if (process.platform !== 'darwin') app.quit()})
 app.on('before-quit', () => {quitting = true; watcher?.close()})
}
