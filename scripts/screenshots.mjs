import {_electron as electron} from 'playwright'
import {mkdtemp, cp, mkdir} from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
const root = await mkdtemp(path.join(os.tmpdir(), 'quizmeadow-screenshots-'))
const library = path.join(root, 'library')
await cp('library', library, {recursive:true})
await mkdir('docs/screenshots', {recursive:true})
const app = await electron.launch({args:['.'],env:{...process.env,QUIZMEADOW_DATA_DIR:path.join(root,'data'),QUIZMEADOW_LIBRARY_DIR:library}})
try {
 const page = await app.firstWindow()
 await page.getByRole('heading',{name:'Make it stick.'}).waitFor()
 await app.evaluate(({BrowserWindow}) => BrowserWindow.getAllWindows()[0].setSize(1380,940))
 await page.getByRole('button',{name:'Settings & data',exact:true}).click()
 await page.getByLabel('Appearance',{exact:true}).selectOption('dark')
 await page.getByRole('button',{name:'Today',exact:true}).click()
 const shot = async name => {await page.waitForTimeout(350); await page.screenshot({path:`docs/screenshots/${name}.png`,scale:'css'})}
 await shot('dashboard')
 await page.getByRole('button',{name:'Library',exact:true}).click()
 await page.getByRole('button',{name:'Start quiz',exact:true}).click()
 await page.getByRole('button',{name:'Begin session',exact:true}).click()
 await page.locator('.answer-option').filter({has:page.getByText('Four',{exact:true})}).click()
 await page.getByRole('button',{name:'Confident',exact:true}).click()
 await shot('question')
 await page.getByRole('button',{name:'Save & exit',exact:true}).click()
 await page.getByRole('button',{name:'Settings & data',exact:true}).click()
 await page.getByLabel('Appearance',{exact:true}).selectOption('dark')
 await page.getByRole('button',{name:'Library',exact:true}).click()
 await shot('library-dark')
 console.log('Captured documentation screenshots using the introduction tour and isolated data.')
} finally {await app.close()}
