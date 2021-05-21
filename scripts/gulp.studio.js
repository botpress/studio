const gulp = require('gulp')
const exec = require('child_process').exec
const rimraf = require('gulp-rimraf')
const { symlink } = require('gulp')
const path = require('path')
const promisify = require('util').promisify
const execAsync = promisify(exec)
const file = require('gulp-file')
const fse = require('fs-extra')

const verbose = process.argv.includes('--verbose')

const pipeOutput = proc => {
  proc.stdout.pipe(process.stdout)
  proc.stderr.pipe(process.stderr)
}

const start = cb => {
  pipeOutput(exec('yarn watch', { cwd: 'frontend' }, cb))
  pipeOutput(exec('yarn start', { cwd: 'backend' }, cb))
}

const buildBackend = cb => {
  const studio = exec('yarn && yarn build', { cwd: 'packages/studio-be' }, err => cb(err))
  verbose && studio.stdout.pipe(process.stdout)
  studio.stderr.pipe(process.stderr)
}

const buildUi = cb => {
  const cmd = process.argv.includes('--prod') ? 'yarn && yarn build:prod --nomap' : 'yarn && yarn build'

  pipeOutput(exec(cmd, { cwd: 'packages/studio-ui' }, err => cb(err)))
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

const watchUi = gulp.series([
  cb => {
    // The timeout is necessary so the backend has time to build successfully (for common files)
    setTimeout(() => {
      pipeOutput(exec('yarn && yarn watch', { cwd: './packages/studio-ui' }, cb))
    }, 6000)
  }
])

const watchBackend = gulp.series([
  cb => {
    pipeOutput(exec('yarn && yarn watch', { cwd: './packages/studio-be' }, cb))
  }
])

const package = async () => {
  try {
    await execAsync(
      `cross-env ./node_modules/.bin/pkg --targets node12-win32-x64,node12-linux-x64,node12-macos-x64 --output ./binaries/studio --compress GZip ./package.json`
    )

    const version = require(path.join(__dirname, '../package.json')).version.replace(/\./g, '_')
    await fse.rename('./binaries/studio-win.exe', `./binaries/studio-v${version}-win-x64.exe`)
    await fse.rename('./binaries/studio-linux', `./binaries/studio-v${version}-linux-x64`)
    await fse.rename('./binaries/studio-macos', `./binaries/studio-v${version}-darwin-x64`)
  } catch (err) {
    console.error('Error running: ', err.cmd, '\nMessage: ', err.stderr, err)
  }
}

const writeMetadata = () => {
  const version = require(path.join(__dirname, '../package.json')).version
  const metadata = JSON.stringify(
    {
      version,
      build_version: `${version}__${Date.now()}`
    },
    null,
    2
  )

  return file('./packages/studio-be/src/metadata.json', metadata, { src: true }).pipe(gulp.dest('./'))
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
  copy,
  writeMetadata
}
