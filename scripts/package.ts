import { ExecException } from 'child_process'
import fse from 'fs-extra'
import path from 'path'
import { execute } from './utils/exec'

const packageApp = async () => {
  const version = require(path.join(__dirname, '../package.json')).version.replace(/\./g, '_')

  try {
    await execute('yarn', { cwd: './packages/studio-be' })
    await execute('cross-env pkg package.json', undefined, { silent: true })

    await fse.rename('./bin/studio-win.exe', `./bin/studio-v${version}-win-x64.exe`)
    await fse.rename('./bin/studio-linux', `./bin/studio-v${version}-linux-x64`)
    await fse.rename('./bin/studio-macos', `./bin/studio-v${version}-darwin-x64`)
  } catch (err) {
    if (err instanceof Error) {
      const error = err as ExecException
      console.error('Error running: ', error.cmd, '\nMessage: ', error['stderr'], err)
    }
  }
}

void packageApp()
