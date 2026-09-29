import {_electron as electron} from 'playwright'
import {mkdtemp,readFile,access} from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import assert from 'node:assert/strict'
const executablePath=process.argv[2]
if (!executablePath) throw new Error('Pass the packaged app executable path.')
const data=await mkdtemp(path.join(os.tmpdir(),'quizmeadow-package-'))
const app=await electron.launch({executablePath,env:{...process.env,QUIZMEADOW_DATA_DIR:data},timeout:30000})
try {
 const page=await app.firstWindow()
 await page.getByRole('heading',{name:'Make it stick.'}).waitFor()
 const state=await page.evaluate(()=>window.quizmeadow.bootstrap())
 assert.equal(state.attempts.length,0)
 assert.equal(state.library.categories.length,1)
 assert.equal(state.library.categories[0].title,'Welcome to QuizMeadow')
 assert.equal(state.library.categories[0].units[0].quizzes[0].questions.length,10)
 assert.equal(state.library.issues.length,0)
 await access(path.join(state.library.root,'WEB-AGENT-PROMPT.md'))
 assert.equal(await app.evaluate(({app})=>app.isPackaged),true)
 assert.equal(await app.evaluate(({app})=>app.getPath('userData')),data)
 const prefs=await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences())
 assert.equal(prefs.contextIsolation,true);assert.equal(prefs.nodeIntegration,false);assert.equal(prefs.sandbox,true)
 await page.getByRole('button',{name:'Start a session',exact:true}).click()
 await page.getByRole('button',{name:'Begin session',exact:true}).click()
 await page.locator('.answer-option').filter({has:page.getByText('Four',{exact:true})}).click()
 await app.close()
 const saved=JSON.parse(await readFile(path.join(data,'session.json'),'utf8')).data
 assert.equal(saved.responses[saved.questions[0].key].answer,'four')
 console.log('Packaged app passed: introduction only, bundled authoring prompt, isolated profile, secure renderer, and save-on-quit.')
} finally {await app.close().catch(()=>{})}
