const gulp = require('gulp')
const exec = require('child_process').exec
const rimraf = require('gulp-rimraf')
const { symlink } = require('gulp')
const path = require('path')
const fse = require('fs-extra')
const promisify = require('util').promisify
const execAsync = promisify(exec)
const glob = require('glob')
const mkdirp = require('mkdirp')

const verbose = process.argv.includes('--verbose')

const getTargetOSNodeVersion = () => {
  if (process.argv.find(x => x.toLowerCase() === '--win32')) {
    return 'node12-win32-x64'
  } else if (process.argv.find(x => x.toLowerCase() === '--linux')) {
    return 'node12-linux-x64'
  } else {
    return 'node12-macos-x64'
  }
}

const getTargetOSName = () => {
  if (process.argv.find(x => x.toLowerCase() === '--win32')) {
    return 'windows'
  } else if (process.argv.find(x => x.toLowerCase() === '--linux')) {
    return 'linux'
  } else {
    return 'darwin'
  }
}

const initStudio = cb => {
  const studio = exec('yarn', { cwd: 'src/bp/ui-studio' }, err => cb(err))
  verbose && studio.stdout.pipe(process.stdout)
  studio.stderr.pipe(process.stderr)
}

const buildSharedLite = () => {
  gulp.task('build:sharedLite', gulp.series([sharedLiteBuild]))

  return gulp.series(['build:sharedLite'])
}

const buildShared = () => {
  gulp.task('build:shared', gulp.series([cleanShared, sharedBuild]))

  return gulp.series(['build:shared'])
}

const buildStudioBackend = cb => {
  const studio = exec('yarn && yarn build', { cwd: 'backend' }, err => cb(err))
  verbose && studio.stdout.pipe(process.stdout)
  studio.stderr.pipe(process.stderr)
}

const buildStudio = cb => {
  const cmd = process.argv.includes('--prod') ? 'yarn && yarn build:prod --nomap' : 'yarn && yarn build'

  const studio = exec(cmd, { cwd: 'frontend' }, err => cb(err))
  verbose && studio.stdout.pipe(process.stdout)
  studio.stderr.pipe(process.stderr)
}

const cleanStudio = () => {
  return gulp.src('./out/bp/ui-studio/public', { allowEmpty: true }).pipe(rimraf())
}

const cleanStudioAssets = () => {
  return gulp.src('./out/bp/data/assets/ui-studio', { allowEmpty: true }).pipe(rimraf())
}

const copyStudio = () => {
  return gulp.src('./frontend/public/**/*').pipe(gulp.dest('./backend/out/ui/public'))
}

const createStudioSymlink = () => {
  // if (!process.env.BP_DATA_FOLDER) {
  //   console.error('please set data folder')
  //   process.exit(1)
  // }
  const data = path.resolve(process.env.BP_DATA_FOLDER, 'assets/studio/ui/')
  rimraf()
  return gulp.src('./frontend/public').pipe(symlink(data, { type: 'dir' }))
}

const watchStudio = gulp.series([
  cleanStudioAssets,
  createStudioSymlink,
  cb => {
    const studio = exec('yarn && yarn watch', { cwd: './frontend' }, err => cb(err))
    studio.stdout.pipe(process.stdout)
    studio.stderr.pipe(process.stderr)
  }
])

const watchStudioBackend = gulp.series([
  cb => {
    const studio = exec('yarn && yarn watch', { cwd: './backend' }, err => cb(err))
    studio.stdout.pipe(process.stdout)
    studio.stderr.pipe(process.stderr)
  }
])

const cleanShared = () => {
  return gulp.src('./out/bp/ui-shared/dist', { allowEmpty: true }).pipe(rimraf())
}

const watchShared = gulp.series([
  cleanShared,
  cb => {
    const shared = exec('yarn && yarn watch', { cwd: 'src/bp/ui-shared' }, err => cb(err))
    shared.stdout.pipe(process.stdout)
    shared.stderr.pipe(process.stderr)
  }
])

const sharedLiteBuild = cb => {
  const shared = exec('yarn', { cwd: 'src/bp/ui-shared-lite' }, err => cb(err))
  shared.stdout.pipe(process.stdout)
  shared.stderr.pipe(process.stderr)
}

const sharedBuild = cb => {
  const shared = exec('yarn && yarn build', { cwd: 'src/bp/ui-shared' }, err => cb(err))
  shared.stdout.pipe(process.stdout)
  shared.stderr.pipe(process.stderr)
}

const packageStudio = async () => {
  const additionalPackageJson = require(path.resolve(__dirname, './backend/studio.pkg.json'))
  const realPackageJson = require(path.resolve(__dirname, './backend/package.json'))
  const tempPkgPath = path.resolve(__dirname, './backend/out/package.json')
  const cwd = path.resolve(__dirname, './backend/out')

  try {
    const packageJson = Object.assign(realPackageJson, additionalPackageJson)
    await fse.writeFile(tempPkgPath, JSON.stringify(packageJson, null, 2), 'utf8')

    await execAsync(
      `cross-env ../../node_modules/.bin/pkg --targets ${getTargetOSNodeVersion()} --output ../../binaries/studio ./package.json`,
      {
        cwd
      }
    )
  } catch (err) {
    console.error('Error running: ', err.cmd, '\nMessage: ', err.stderr, err)
  } finally {
    await fse.unlink(tempPkgPath)
  }
}

const copyNativeExtensions = async () => {
  const files = [
    ...glob.sync('./build/native-extensions/*.node'),
    ...glob.sync('./node_modules/**/node-v64-*/*.node'),
    ...glob.sync(`./build/native-extensions/${getTargetOSName()}/**/*.node`)
  ]

  mkdirp.sync('./backend/binaries/bindings/')

  for (const file of files) {
    if (file.indexOf(path.join('native-extensions', getTargetOSName()).replace('\\', '/')) > 0) {
      const dist = path.basename(path.dirname(file))
      const targetDir = `./backend/binaries/bindings/${getTargetOSName()}/${dist}`
      mkdirp.sync(path.resolve(targetDir))
      await fse.copyFile(path.resolve(file), path.resolve(targetDir, path.basename(file)))
    } else {
      fse.copyFile(path.resolve(file), path.resolve('./backend/binaries/bindings/', path.basename(file)))
    }
  }
}

gulp.task('watch:studio', gulp.parallel([watchStudioBackend, watchStudio]))
gulp.task('package:studio', gulp.series([packageStudio, copyNativeExtensions]))
gulp.task('build:shared', gulp.series([cleanShared, sharedBuild]))
gulp.task('build:studio', gulp.series([buildStudioBackend, buildStudio, cleanStudio, cleanStudioAssets, copyStudio]))
