const gulp = require('gulp')
const exec = require('child_process').exec
const rimraf = require('gulp-rimraf')
const { symlink } = require('gulp')
const path = require('path')
const promisify = require('util').promisify
const execAsync = promisify(exec)

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

const createStudioSymlink = () => {
  const data = path.resolve(process.env.BP_DATA_FOLDER, 'assets/studio/ui/')
  rimraf()
  return gulp.src('./frontend/public').pipe(symlink(data, { type: 'dir' }))
}

const watchUi = gulp.series([
  cleanAssets,
  createStudioSymlink,
  cb => {
    const studio = exec('yarn && yarn watch', { cwd: './frontend' }, err => cb(err))
    studio.stdout.pipe(process.stdout)
    studio.stderr.pipe(process.stderr)
  }
])

const watchBackend = gulp.series([
  cb => {
    const studio = exec('yarn && yarn watch', { cwd: './packages/studio-be' }, err => cb(err))
    studio.stdout.pipe(process.stdout)
    studio.stderr.pipe(process.stderr)
  }
])

const package = async () => {
  try {
    await execAsync(
      `cross-env ./node_modules/.bin/pkg --targets node12-win32-x64,node12-linux-x64,node12-macos-x64 --output ./binaries/studio ./package.json`
    )
  } catch (err) {
    console.error('Error running: ', err.cmd, '\nMessage: ', err.stderr, err)
  }
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
  copy
}
