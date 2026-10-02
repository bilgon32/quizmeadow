import {createRequire} from 'node:module'
import {readFile, writeFile, mkdir} from 'node:fs/promises'
import {execFileSync} from 'node:child_process'
import path from 'node:path'
const require = createRequire(import.meta.url)
const {Resvg} = require(process.argv[2] || '@resvg/resvg-js')
const sources = Object.fromEntries(await Promise.all(['micro', 'standard', 'display'].map(async master => [master, await readFile(`assets/logo/quizmeadow-${master}-dark.svg`, 'utf8')])))
const platform = master => `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><rect x="100" y="100" width="824" height="824" rx="180" fill="#172638"/>${sources[master].replace('<svg ', '<svg x="168" y="164" width="688" height="688" ')}</svg>`
const render = (svg, pixels) => new Resvg(svg, {fitTo: {mode: 'width', value: pixels}}).render().asPng()
await writeFile('resources/icon.svg', platform('display'))
await mkdir('resources/QuizMeadow.iconset', {recursive: true})
for (const size of [16, 32, 128, 256, 512]) for (const scale of [1, 2]) {
 const master = size < 32 ? 'micro' : size < 128 ? 'standard' : 'display'
 await writeFile(path.join('resources/QuizMeadow.iconset', `icon_${size}x${size}${scale === 2 ? '@2x' : ''}.png`), render(platform(master), size * scale))
}
execFileSync('/usr/bin/iconutil', ['-c', 'icns', 'resources/QuizMeadow.iconset', '-o', 'resources/icon.icns'], {stdio: 'inherit'})
await mkdir('assets/logo/exports', {recursive: true})
for (const theme of ['light', 'dark']) for (const size of [16,20,24,32,48,64,128,256,512,1024]) {
 const master = size < 32 ? 'micro' : size < 128 ? 'standard' : 'display'
 const svg = await readFile(`assets/logo/quizmeadow-${master}-${theme}.svg`, 'utf8')
 await writeFile(`assets/logo/exports/quizmeadow-${size}-${theme}.png`, render(svg, size))
 await writeFile(`assets/logo/exports/quizmeadow-${size}-${theme}@2x.png`, render(svg, size * 2))
}
const backgrounds=[['Paper','#F9FAFC','light'],['Charcoal','#101925','dark'],['Saturated comparison','#315B9C','mono-negative']]
let sheet='<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="720"><rect width="1000" height="720" fill="#ECEEF2"/><text x="24" y="35" font-family="Barlow" font-size="20" fill="#233449">QuizMeadow · meadow fold · actual-size review</text>'
for(const [index,[name,background,theme]] of backgrounds.entries()) {
 const y=60+index*172;sheet+=`<rect x="16" y="${y}" width="968" height="156" rx="5" fill="${background}"/><text x="32" y="${y+28}" font-family="Barlow" font-size="16" fill="${theme==='light'?'#233449':'#EDF2FF'}">${name}</text>`
 let x=260
 for(const size of [16,20,24,32,48,64,128]) {
  const master=size<32?'micro':size<128?'standard':'display'
  let svg=await readFile(theme==='mono-negative'?'assets/logo/logo-mono-negative.svg':`assets/logo/quizmeadow-${master}-${theme}.svg`,'utf8')
  if(theme==='mono-negative') svg=(await readFile(`assets/logo/logo-${master}.svg`,'utf8')).replace('currentColor','#FFFFFF')
  sheet+=svg.replace('<svg ',`<svg x="${x}" y="${y+(156-size)/2}" width="${size}" height="${size}" `)
  sheet+=`<text x="${x}" y="${y+144}" font-family="Barlow" font-size="12" fill="${theme==='light'?'#506277':'#EDF2FF'}">${size}</text>`
  x+=size+26
 }
}
sheet+='<text x="24" y="625" font-family="Barlow" font-size="16" fill="#233449">Clear space ≥ 12/64 of the master. Micro: 16–24 · Standard: 32–64 · Display: 128+</text><text x="24" y="657" font-family="Barlow" font-size="16" fill="#233449">Flat original vectors · separate one-color positive/negative · Mac platform canvas is separate</text></svg>'
await writeFile('assets/logo/exports/usage-sheet.svg',sheet)
await writeFile('assets/logo/exports/usage-sheet.png',new Resvg(sheet,{font:{fontFiles:['assets/logo/fonts/Barlow-Regular.ttf'],loadSystemFonts:false}}).render().asPng())
console.log('Exported three optical masters, transparent 1×/2× PNGs, Mac ICNS and usage sheet.')
