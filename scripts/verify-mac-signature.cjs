const {execFileSync} = require('node:child_process')
const path = require('node:path')

// Check the final bundle after Electron has been renamed and all resources added.
// A successful build must never ship the stale signature from Electron's binary.
module.exports = async context => {
  if (context.electronPlatformName !== 'darwin') return
  const app = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`)
  execFileSync('/usr/bin/codesign', ['--verify', '--deep', '--strict', '--verbose=2', app], {stdio: 'inherit'})
}
