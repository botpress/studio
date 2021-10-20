const gulp = require('gulp')

const shared = require('./scripts/gulp.shared')
const studio = require('./scripts/gulp.studio')
const component = require('./scripts/gulp.component')
const envDebug = require('./scripts/gulp.env.debug')

gulp.task('build:shared', gulp.series([shared.clean, shared.buildLite, shared.build]))

gulp.task('start:studio', gulp.parallel([studio.start]))
gulp.task('watch:studio', gulp.parallel([studio.watchBackend, studio.watchUi]))
gulp.task('package:studio', gulp.series([studio.package]))

gulp.task('component:create', gulp.series([component.create]))

gulp.task('build:studio-be', gulp.series([studio.writeMetadata, studio.buildBackend, studio.copyBuiltin]))
gulp.task('build:studio-ui', gulp.series([studio.buildUi, studio.clean, studio.cleanAssets, studio.copy]))

gulp.task('build', gulp.series([studio.buildNativeExtensions, 'build:studio-be', 'build:shared', 'build:studio-ui']))

gulp.task('create:env.debug', gulp.series([envDebug.createDefaultEnvFileForDebugging]))
