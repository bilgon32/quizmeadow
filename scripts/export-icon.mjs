import {createRequire} from 'node:module'
import {readFile, writeFile, mkdir} from 'node:fs/promises'
import {execFileSync} from 'node:child_process'
import path from 'node:path'

// The optional argument supports exporting with an existing brand-tool checkout.
// Normal use after npm ci: npm run icon
const require = createRequire(import.meta.url)
const {Resvg} = require(process.argv[2] || '@resvg/resvg-js')
const optical = await readFile('src/renderer/brand/quizmeadow.svg', 'utf8')
const mono = await readFile('src/renderer/brand/quizmeadow-mono.svg', 'utf8')
const canvas = source => source.replace('fill="none">', 'fill="none"><rect x="100" y="50" width="600" height="600" rx="110" fill="#161C1B"/>')
await writeFile('resources/icon.svg', canvas(optical))
const iconset = 'resources/QuizMeadow.iconset'
await mkdir(iconset, {recursive: true})
for (const size of [16, 32, 128, 256, 512]) {
  for (const scale of [1, 2]) {
    const pixels = size * scale
    const source = pixels <= 32 ? mono : optical
    const png = new Resvg(canvas(source), {fitTo: {mode: 'width', value: pixels}}).render().asPng()
    await writeFile(path.join(iconset, `icon_${size}x${size}${scale === 2 ? '@2x' : ''}.png`), png)
  }
}
execFileSync('/usr/bin/iconutil', ['-c', 'icns', iconset, '-o', 'resources/icon.icns'], {stdio: 'inherit'})
console.log('Exported the optical study mark and monochrome small icons.')
