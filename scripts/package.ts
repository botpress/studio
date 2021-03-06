import fs from 'fs'
import { execute } from './utils/exec'
import logger from './utils/logger'
import { getProjectVersion, formatVersion } from './utils/version'

const outputPath = './bin'

const installBindings = async () => {
  const platforms = ['darwin', 'win32', 'linux']

  for (const platform of platforms) {
    await execute(
      `cross-env ./node_modules/.bin/node-pre-gyp install --directory=./node_modules/sqlite3 --target_platform=${platform} --target_arch=x64`,
      undefined,
      { silent: true }
    )
  }
}

const renameBinaries = async () => {
  const formattedVersion = formatVersion(getProjectVersion())
  const mappings = [
    ['studio-win.exe', `studio-v${formattedVersion}-win-x64.exe`],
    ['studio-linux', `studio-v${formattedVersion}-linux-x64`],
    ['studio-macos', `studio-v${formattedVersion}-darwin-x64`]
  ]

  for (const [oldPath, newPath] of mappings) {
    await new Promise((resolve, reject) =>
      fs.rename(`${outputPath}/${oldPath}`, `${outputPath}/${newPath}`, (err) =>
        err ? reject(err) : resolve(undefined)
      )
    )
  }
}

const packageApp = async () => {
  try {
    await installBindings()

    await execute(`pkg --out-path ${outputPath} package.json`, undefined, { silent: true })

    await renameBinaries()

    logger.info(`Binaries produced successfully and can be found inside the '${outputPath}' folder`)
  } catch (err) {
    logger.error('Error while packaging app', err as Error)
  }
}

void packageApp()
