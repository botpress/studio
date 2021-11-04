import * as sdk from 'botpress/sdk'
import { spawn } from 'child_process'
import { GhostService } from 'core/bpfs'
import { createArchive } from 'core/misc/archive'
import fse from 'fs-extra'
import glob from 'glob'
import mkdirp from 'mkdirp'
import ncp from 'ncp'
import path from 'path'

import example from './example'

const debug = DEBUG('libraries')
const LIB_FOLDER = 'libraries/'

const sanitizeArg = (text: string) => text.replace(/[^a-zA-Z0-9\/_.@^\-\(\) ]/g, '').replace(/\/\//, '/')
const getBotLibPath = (botId: string, fileName?: string) =>
  path.join(process.BOT_LOCATION, `${LIB_FOLDER}${fileName ? `/${fileName}` : ''}`)

export class LibrariesService {
  private npmPath?: string
  constructor(private logger: sdk.Logger, private bpfs: GhostService) {}

  isInitialized = (botId: string) => {
    return this.bpfs.forBot(botId).fileExists(LIB_FOLDER, 'package.json')
  }

  createDefaultPackage = async (botId: string) => {
    const pkgFileLocation = getBotLibPath(botId, 'package.json')

    if (await fse.pathExists(pkgFileLocation)) {
      return
    }

    const baseJson = {
      name: 'libraries',
      version: '1.0.0',
      description: 'Libraries',
      repository: 'none',
      dependencies: {},
      author: '',
      private: true
    }

    mkdirp.sync(getBotLibPath(botId))
    await fse.writeJSON(pkgFileLocation, baseJson)
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

  async syncLocalPackage(botId: string) {
    if (!(await this.isInitialized(botId))) {
      await this.createDefaultPackage(botId)
      // Ensure we have the latest copy from the database before running operations
    }
  }

  executeNpm = async (botId: string, args: string[] = ['install'], customLibsDir?: string): Promise<string> => {
    await this.syncLocalPackage(botId)

    const npmPath = await this.getNpmPath()
    const cliPath = path.resolve(npmPath!, 'bin/npm-cli.js')

    const cleanArgs = this.prepareArgs(args)
    const cwd = customLibsDir ?? path.resolve(process.BOT_LOCATION, LIB_FOLDER)

    mkdirp.sync(cwd)
    debug('executing npm', { execPath: process.execPath, cwd, args, cleanArgs })

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
    const result = resultBuffer.join('')

    if (result.indexOf('ERR!') === -1) {
      this.logger.info(`Command executed successfully: ${result}`)
    } else {
      throw new Error(result)
    }

    return resultBuffer.join('')
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

  deleteLibraryArchive = async (botId: string, filename: string) => {
    try {
      if (await this.bpfs.forBot(botId).fileExists(LIB_FOLDER, filename)) {
        await this.bpfs.forBot(botId).deleteFile(LIB_FOLDER, filename)
      }

      if (await fse.pathExists(getBotLibPath(botId, filename))) {
        await fse.remove(getBotLibPath(botId, filename))
      }
    } catch (err) {
      this.logger.warn(`Error while deleting the library archive ${err}`)
    }
  }

  removeLibrary = async (botId: string, name: string): Promise<boolean> => {
    let source, packageContent
    try {
      packageContent = await fse.readJson(getBotLibPath(botId, 'package.json'))
      source = packageContent.dependencies[name]
    } catch (err) {
      this.logger.attachError(err).error("Couldn't read package json")
      return false
    }

    if (!source) {
      return false
    }

    if (source.endsWith('.tgz')) {
      await this.deleteLibraryArchive(botId, source.replace('file:', ''))
    }

    delete packageContent.dependencies[name]
    await fse.writeJSON(getBotLibPath(botId, 'package.json'), packageContent)

    await this.executeNpm(botId)

    return true
  }

  getNpmPath = async () => {
    if (this.npmPath) {
      return this.npmPath
    }

    if (!process.pkg) {
      return (this.npmPath = path.resolve(process.cwd(), '../../../node_modules/npm'))
    }

    const npmAppPath = path.resolve(process.APP_DATA_PATH, 'npm')
    if (!(await fse.pathExists(npmAppPath))) {
      const modPath = path.resolve(path.dirname(require.main?.path || ''), '../../node_modules/npm')

      await Promise.fromCallback(cb => ncp(modPath, npmAppPath, cb))
      debug('Extracted NPM %o', { npmAppPath, modPath })
    }

    return (this.npmPath = npmAppPath)
  }
}
