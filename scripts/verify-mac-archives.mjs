import {execFileSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import {mkdtemp, readFile, readdir, rm, writeFile} from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import assert from 'node:assert/strict'

const release = path.resolve('release')
const version = JSON.parse(await readFile('package.json', 'utf8')).version
const sums = []
for (const arch of ['arm64', 'x64']) {
  const filename = `QuizMeadow-mac-${arch}.zip`
  const archive = path.join(release, filename)
  const temporary = await mkdtemp(path.join(os.tmpdir(), `quizmeadow-verify-${arch}-`))
  try {
    execFileSync('/usr/bin/ditto', ['-x', '-k', archive, temporary])
    const apps = (await readdir(temporary)).filter(name => name.endsWith('.app'))
    assert.deepEqual(apps, ['QuizMeadow.app'], 'Archive must contain exactly the expected app')
    const app = path.join(temporary, apps[0])
    execFileSync('/usr/bin/codesign', ['--verify', '--deep', '--strict', '--verbose=2', app], {stdio: 'inherit'})
    const bundleVersion = execFileSync('/usr/bin/plutil', ['-extract', 'CFBundleShortVersionString', 'raw', '-o', '-', path.join(app, 'Contents/Info.plist')], {encoding: 'utf8'}).trim()
    assert.equal(bundleVersion, version, 'Archive version must match the release source')
    const architecture = execFileSync('/usr/bin/lipo', ['-archs', path.join(app, 'Contents/MacOS/QuizMeadow')], {encoding: 'utf8'}).trim()
    assert.equal(architecture, arch === 'x64' ? 'x86_64' : 'arm64')
    if (process.argv.includes('--test-tamper') && arch === 'arm64') {
      const resource = path.join(app, 'Contents/Resources/app.asar')
      await writeFile(resource, Buffer.concat([await readFile(resource), Buffer.from('\nmodified')]))
      assert.throws(() => execFileSync('/usr/bin/codesign', ['--verify', '--deep', '--strict', app], {stdio: 'pipe'}), 'Verification must reject a modified resource')
      console.log('Tampered resource correctly rejected.')
    }
    sums.push(`${createHash('sha256').update(await readFile(archive)).digest('hex')}  ${filename}`)
    console.log(`Verified ${filename}: version ${version}, ${architecture}, intact resource seal.`)
  } finally {await rm(temporary, {recursive: true, force: true})}
}
await writeFile(path.join(release, 'SHA256SUMS.txt'), sums.join('\n') + '\n')
