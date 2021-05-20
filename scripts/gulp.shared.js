const gulp = require('gulp')
const exec = require('child_process').exec
const rimraf = require('gulp-rimraf')

const clean = () => {
  return gulp.src('./packages/ui-shared/dist', { allowEmpty: true }).pipe(rimraf())
}

const watch = gulp.series([
  clean,
  cb => {
    const shared = exec('yarn && yarn watch', { cwd: 'packages/ui-shared' }, err => cb(err))
    shared.stdout.pipe(process.stdout)
    shared.stderr.pipe(process.stderr)
  }
])

const buildLite = cb => {
  const shared = exec('yarn', { cwd: 'packages/ui-shared-lite' }, err => cb(err))
  shared.stdout.pipe(process.stdout)
  shared.stderr.pipe(process.stderr)
}

const build = cb => {
  const shared = exec('yarn && yarn build', { cwd: 'packages/ui-shared' }, err => cb(err))
  shared.stdout.pipe(process.stdout)
  shared.stderr.pipe(process.stderr)
}

module.exports = {
  clean,
  watch,
  buildLite,
  build
}
