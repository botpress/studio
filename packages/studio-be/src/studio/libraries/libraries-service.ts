import * as sdk from 'botpress/sdk'
import { spawn } from 'child_process'
import { GhostService } from 'core/bpfs'
import fse from 'fs-extra'
import mkdirp from 'mkdirp'
import ncp from 'ncp'
import path from 'path'
import tmp from 'tmp'

import example from './example'

const debug = DEBUG('libraries')
const LIB_FOLDER = 'libraries/'

const sanitizeArg = (text: string) => text.replace(/[^a-zA-Z0-9\/_.@^\-\(\) ]/g, '').replace(/\/\//, '/')
const getBotLibPath = (botId: string, fileName: string) =>
  path.join(process.DATA_LOCATION, `bots/${botId}/${LIB_FOLDER}/${fileName}`)

export class LibrariesService {
  private npmPath?: string
  constructor(private logger: sdk.Logger, private bpfs: GhostService) {}

  isInitialized = (botId: string) => {
    return this.bpfs.forBot(botId).fileExists(LIB_FOLDER, 'package.json')
  }

  prepareArgs = (args: string[]) => {
    // if (isOffline) {
    //   args.push('--offline')
    // }

    // Hides superfluous messages
    args.push('--no-fund')

    // Necessary for post install scripts when running from the binary
    args.push('--scripts-prepend-node-path')

    return args.map(x => sanitizeArg(x))
  }

  executeNpm = async (botId: string, args: string[] = ['install'], customLibsDir?: string): Promise<string> => {
    const npmPath = this.getNpmPath()
    const cliPath = path.resolve(npmPath!, 'bin/npm-cli.js')

    if (!(await this.isInitialized(botId))) {
      await this.initialize(botId)
    }

    const cleanArgs = this.prepareArgs(args)
    const cwd = path.resolve(process.DATA_LOCATION, 'bots', botId, LIB_FOLDER)

    mkdirp.sync(cwd)
    debug('executing npm', { execPath: process.execPath, cwd, args, cleanArgs })

    try {
      const spawned = spawn(process.execPath, [cliPath, ...cleanArgs], {
        cwd,
        env: {
          ...process.env,
          PATH: `${process.env.PATH}:${path.dirname(process.execPath)}`,
          PKG_EXECPATH: 'PKG_INVOKE_NODEJS'
        }
      })

      const resultBuffer: string[] = []

      spawned.stdout.on('data', msg => resultBuffer.push(msg.toString()))
      spawned.stderr.on('data', msg => resultBuffer.push(msg.toString()))

      await Promise.fromCallback(cb => spawned.stdout.on('close', cb))

      return resultBuffer.join('')
    } catch (err) {
      console.error('error ', err)
    }
    return ''
  }

  createNodeSymlink = async () => {
    const nodePath = path.join(path.dirname(process.execPath), 'node')

    // The symlink is only necessary when running the binary and node is not installed
    if (process.execPath.endsWith('bp.exe') || process.execPath.endsWith('bp')) {
      if (!(await fse.pathExists(nodePath))) {
        await fse.symlink(process.execPath, nodePath)
      }
    }
  }

  syncAllFiles = async () => {
    // const files = await this.bpfs.global().directoryListing(LIB_FOLDER, '*.*')
    // await Promise.mapSeries(files, file => this.copyFileLocally(file))
  }

  copyFileLocally = async (botId: string, fileName: string): Promise<boolean> => {
    if (!(await this.bpfs.forBot(botId).fileExists(LIB_FOLDER, fileName))) {
      return false
    }

    try {
      const fileContent = await this.bpfs.forBot(botId).readFileAsBuffer(LIB_FOLDER, fileName)
      await fse.writeFile(getBotLibPath(botId, fileName), fileContent)
      return true
    } catch (err) {
      this.logger.error(`Couldn't copy locally. ${err}`)
      return false
    }
  }

  deleteLibraryArchive = async (filename: string) => {
    // try {
    //   if (await this.bpfs.global().fileExists(LIB_FOLDER, filename)) {
    //     await this.bpfs.global().deleteFile(LIB_FOLDER, filename)
    //   }
    //   if (await fse.pathExists(path.join(sharedLibsDir, filename))) {
    //     await fse.remove(path.join(sharedLibsDir, filename))
    //   }
    // } catch (err) {
    //   this.logger.warn(`Error while deleting the library archive ${err}`)
    // }
  }

  removeLibrary = async (name: string, logger: sdk.Logger, bpfs: GhostService): Promise<boolean> => {
    let source, packageContent
    // try {
    //   packageContent = await fse.readJson(packageJsonPath)
    //   source = packageContent.dependencies[name]
    // } catch (err) {
    //   logger.attachError(err).error("Couldn't read package json")
    //   return false
    // }

    // if (!source) {
    //   return false
    // }

    // if (source.endsWith('.tgz')) {
    //   await this.deleteLibraryArchive(source.replace('file:', ''))
    // }

    // delete packageContent.dependencies[name]
    // await fse.writeJSON(packageJsonPath, packageContent)

    return true
  }

  createDefaultExample = async () => {
    await this.bpfs.global().upsertFile(LIB_FOLDER, 'example.js', example)
  }

  getNpmPath = () => {
    if (this.npmPath) {
      return this.npmPath
    }

    const tmpDir = tmp.dirSync({ unsafeCleanup: true })
    if (!process.pkg) {
      return (this.npmPath = path.resolve(process.cwd(), '../../../node_modules/npm'))
    }

    const modPath = path.resolve(path.dirname(require.main?.filename || ''), '../../node_modules/npm')

    this.npmPath = tmpDir.name
    try {
      ncp(modPath, this.npmPath, err => {
        console.log('DONE', this.npmPath, err)
      })
    } catch (err) {
      console.log(err.message)
    }
  }

  initialize = async (botId: string) => {
    const baseJson = {
      name: 'shared_libs',
      version: '1.0.0',
      description: 'Shared Libraries',
      repository: 'none',
      dependencies: {},
      author: '',
      private: true
    }

    await this.bpfs.forBot(botId).upsertFile('libraries', 'package.json', JSON.stringify(baseJson, undefined, 2))

    if (process.BPFS_STORAGE === 'database') {
      await fse.writeJson(getBotLibPath(botId, 'package.json'), baseJson)
    }
  }

  publishPackageChanges = async (botId: string) => {
    if (process.BPFS_STORAGE !== 'database') {
      return
    }

    const packageContent = await fse.readJSON(getBotLibPath(botId, 'package.json'))
    await this.bpfs.forBot(botId).upsertFile('libraries', 'package.json', packageContent)

    const packageLockContent = await fse.readFile(getBotLibPath(botId, 'package-lock.json'), 'UTF-8')
    await this.bpfs.forBot(botId).upsertFile('libraries', 'package-lock.json', packageLockContent)
  }

  // packageLibrary = async (name: string, version: string) => {
  //   const tmpDir = tmp.dirSync({ unsafeCleanup: true })

  //   const tempPackageJson = path.join(tmpDir.name, 'package.json')
  //   const libFolder = path.join(tmpDir.name, 'node_modules', name)
  //   const libPackageJson = path.join(libFolder, 'package.json')

  //   try {
  //     await fse.writeJson(tempPackageJson, emptyPackage)

  //     // Legacy bundling ensures the library's dependencies are inside the library folder
  //     const installResult = await executeNpm(['install', `${name}@${version}`, '--legacy-bundling'], tmpDir.name)
  //     debug('Temporary installation of the library ', { installResult })

  //     const pkg: Package = await fse.readJson(libPackageJson)
  //     addBundledDeps(pkg)
  //     disableScripts(pkg)

  //     await fse.writeJson(libPackageJson, pkg)

  //     const packResult = await executeNpm(['pack'], libFolder)
  //     debug('Temporary packaging of the library ', { packResult })

  //     const archiveName = (await fse.readdir(libFolder)).find(x => x.endsWith('.tgz'))
  //     return await fse.readFile(path.join(libFolder, archiveName))
  //   } catch (err) {
  //     bpLogger.attachError(err).error('Error while trying to package the library')
  //   } finally {
  //     tmpDir.removeCallback()
  //   }
}
