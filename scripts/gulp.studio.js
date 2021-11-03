require('bluebird-global')
const gulp = require('gulp')
const rimraf = require('gulp-rimraf')
const path = require('path')
const { exec } = require('child_process')
const file = require('gulp-file')
const fse = require('fs-extra')
const { execute } = require('./utils/exec')
const buildJsonSchemas = require('./jsonschemas')

const studioRoot = './packages/studio-be'

const start = cb => {
  console.info(`
  The studio is not meant to be run as a standalone just yet.
  Please set DEV_STUDIO_PATH on the main server repository to the out/ folder of packages/studio-be
  
  If you absolutely want to run the studio as a standalone, please type 'yarn start' in 'packages/studio-be`)
}

const buildBackend = async () => {
  await execute('yarn && yarn build', { cwd: 'packages/studio-be' })
}

const buildSchemas = cb => {
  buildJsonSchemas()
  cb()
}

const buildUi = async cb => {
  const cmd = process.argv.includes('--prod') ? 'yarn && yarn build:prod --nomap' : 'yarn && yarn build'
  await execute(cmd, { cwd: 'packages/studio-ui' })
}

const clean = () => {
  return gulp.src('./packages/studio-be/out/ui/public', { allowEmpty: true }).pipe(rimraf())
}

const cleanAssets = () => {
  return gulp.src('./out/bp/data/assets/ui-studio', { allowEmpty: true }).pipe(rimraf())
}

const copy = () => {
  return gulp.src('./packages/studio-ui/public/**/*').pipe(gulp.dest('./packages/studio-be/out/ui/public'))
}

const watchUi = async cb => {
  // The timeout is necessary so the backend has time to build successfully (for common files)
  setTimeout(() => {
    execute('yarn && yarn watch', { cwd: './packages/studio-ui' })
    cb()
  }, 6000)
}

const watchBackend = async () => {
  await execute('yarn && yarn watch', { cwd: './packages/studio-be' })
}

const buildNativeExtensions = async () => {
  await execute('yarn && yarn build', { cwd: './packages/native-extensions' })
}

const copyBuiltin = async () => {
  await fse.copy(`${studioRoot}/src/builtin`, `${studioRoot}/out/builtin`)
  await fse.copy(`${studioRoot}/src/typings/node.d.txt`, `${studioRoot}/out/typings/node.d.txt`)
  await fse.copy(`${studioRoot}/src/typings/es6include.txt`, `${studioRoot}/out/typings/es6include.txt`)
  await fse.copy(`${studioRoot}/src/sdk/botpress.d.ts`, `${studioRoot}/out/sdk/botpress.d.txt`)
  await fse.copy(`${studioRoot}/src/sdk/botpress.runtime.d.ts`, `${studioRoot}/out/sdk/botpress.runtime.d.txt`)
}

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

const writeMetadata = async () => {
  const metadata = {
    version: require(path.join(__dirname, '../package.json')).version,
    date: Date.now(),
    branch: 'master'
  }

  try {
    const currentBranch = await Promise.fromCallback(cb => exec('git rev-parse --abbrev-ref HEAD', cb))
    metadata.branch = currentBranch.replace('\n', '')
  } catch (err) {
    console.error(`Couldn't get active branch`, err)
  }

  return file('./packages/studio-be/src/metadata.json', JSON.stringify(metadata, null, 2), { src: true }).pipe(
    gulp.dest('./')
  )
}

module.exports = {
  start,
  watchBackend,
  watchUi,
  package,
  buildBackend,
  buildUi,
  clean,
  cleanAssets,
  buildSchemas,
  copy,
  copyBuiltin,
  writeMetadata,
  buildNativeExtensions
}
