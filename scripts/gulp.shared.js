const gulp = require('gulp')
const rimraf = require('gulp-rimraf')
const { execute } = require('./utils/exec')

const clean = () => {
  return gulp.src('./packages/ui-shared/dist', { allowEmpty: true }).pipe(rimraf())
}

const watch = gulp.series([
  clean,
  async () => {
    await execute('yarn && yarn watch', { cwd: 'packages/ui-shared' })
  }
])

const buildLite = async () => {
  await execute('yarn', { cwd: 'packages/ui-shared-lite' })
}

const build = async () => {
  await execute('yarn && yarn build', { cwd: 'packages/ui-shared' })
}

module.exports = {
  clean,
  watch,
  buildLite,
  build
}
