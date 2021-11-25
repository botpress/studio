require('bluebird-global')
const path = require('path')
const fse = require('fs-extra')
const { execute } = require('./utils/exec')

const package = async () => {
  const version = require(path.join(__dirname, '../package.json')).version.replace(/\./g, '_')

  try {
    await execute('yarn', { cwd: './packages/studio-be' })
    await execute('cross-env pkg package.json', undefined, { silent: true })

    await fse.rename('./bin/studio-win.exe', `./bin/studio-v${version}-win-x64.exe`)
    await fse.rename('./bin/studio-linux', `./bin/studio-v${version}-linux-x64`)
    await fse.rename('./bin/studio-macos', `./bin/studio-v${version}-darwin-x64`)
  } catch (err) {
    console.error('Error running: ', err.cmd, '\nMessage: ', err.stderr, err)
  }
}

package()
