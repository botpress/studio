import { DirectoryListingOptions, ListenHandle, Logger, UpsertOptions, BotConfig } from 'botpress/sdk'
import { ObjectCache } from 'common/object-cache'
import { isValidBotId } from 'common/validation'
import { TYPES } from 'core/app/types'
import { createArchive } from 'core/misc/archive'
import { asBytes, forceForwardSlashes, sanitize } from 'core/misc/utils'
import { EventEmitter2 } from 'eventemitter2'
import fse from 'fs-extra'
import { inject, injectable, tagged } from 'inversify'
import jsonlintMod from 'jsonlint-mod'
import _ from 'lodash'
import minimatch from 'minimatch'
import mkdirp from 'mkdirp'
import path from 'path'
import replace from 'replace-in-file'
import tmp from 'tmp'
import { VError } from 'verror'

import { ReplaceContent, StorageDriver } from '.'
import { DiskStorageDriver } from './drivers/disk-driver'

interface ScopedGhostOptions {
  botId?: string
  // Archive upload requires the full path, including drive letter, so it should not be sanitized
  noSanitize?: boolean
}

const MAX_GHOST_FILE_SIZE = '100mb'
const GLOBAL_GHOST_KEY = '__global__'
const STUDIO_GHOST_KEY = '__studio__'

@injectable()
export class GhostService {
  private _scopedGhosts: Map<string, ScopedGhostService> = new Map()

  private baseFolder = './'

  constructor(
    @inject(TYPES.DiskStorageDriver) private diskDriver: DiskStorageDriver,
    @inject(TYPES.ObjectCache) private cache: ObjectCache,
    @inject(TYPES.Logger)
    @tagged('name', 'GhostService')
    private logger: Logger
  ) {}

  async initialize() {
    this._scopedGhosts.clear()
  }

  forBot(botId: string): ScopedGhostService {
    if (!isValidBotId(botId)) {
      throw new Error(`Invalid botId "${botId}"`)
    }

    if (this._scopedGhosts.has(botId)) {
      return this._scopedGhosts.get(botId)!
    }

    const scopedGhost = new ScopedGhostService(`${this.baseFolder}`, this.diskDriver, this.cache, { botId })

    this._scopedGhosts.set(botId, scopedGhost)
    return scopedGhost
  }
}

export interface FileContent {
  name: string
  content: string | Buffer
}

export class ScopedGhostService {
  isDirectoryGlob: boolean
  primaryDriver: StorageDriver
  events: EventEmitter2 = new EventEmitter2()

  constructor(
    private baseDir: string,
    private diskDriver: DiskStorageDriver,
    private cache: ObjectCache,
    private options: ScopedGhostOptions = {
      botId: undefined,
      noSanitize: true
    }
  ) {
    if (![-1, this.baseDir.length - 1].includes(this.baseDir.indexOf('*'))) {
      throw new Error("Base directory can only contain '*' at the end of the path")
    }

    this.isDirectoryGlob = this.baseDir.endsWith('*')
    this.primaryDriver = diskDriver
  }

  private _normalizeFolderName(rootFolder: string) {
    const folder = forceForwardSlashes(path.join(this.baseDir, rootFolder))
    return this.options.noSanitize ? folder : sanitize(folder, 'folder')
  }

  private _normalizeFileName(rootFolder: string, file: string) {
    const fullPath = path.join(rootFolder, file)
    const folder = this._normalizeFolderName(path.dirname(fullPath))
    return forceForwardSlashes(path.join(folder, sanitize(path.basename(fullPath))))
  }

  objectCacheKey = str => `object::${str}`
  bufferCacheKey = str => `buffer::${str}`

  private async _invalidateFile(fileName: string) {
    await this.cache.invalidate(this.objectCacheKey(fileName))
    await this.cache.invalidate(this.bufferCacheKey(fileName))
  }

  async invalidateFile(rootFolder: string, fileName: string): Promise<void> {
    const filePath = this._normalizeFileName(rootFolder, fileName)
    await this._invalidateFile(filePath)
  }

  async ensureDirs(rootFolder: string, directories: string[]): Promise<void> {
    await Promise.mapSeries(directories, d => this.diskDriver.createDir(this._normalizeFileName(rootFolder, d)))
  }

  // temporary until we implement a large file storage system
  // size is increased because NLU models are getting bigger
  private getFileSizeLimit(fileName: string): number {
    const humanSize = fileName.endsWith('.model') ? '500mb' : MAX_GHOST_FILE_SIZE
    return asBytes(humanSize)
  }

  async upsertFile(
    rootFolder: string,
    file: string,
    content: string | Buffer,
    options: UpsertOptions = {
      recordRevision: true,
      syncDbToDisk: false,
      ignoreLock: false
    }
  ): Promise<void> {
    if (this.isDirectoryGlob) {
      throw new Error("Ghost can't read or write under this scope")
    }

    const fileName = this._normalizeFileName(rootFolder, file)
    if (content.length > this.getFileSizeLimit(fileName)) {
      throw new Error(`The size of the file ${fileName} is over the 100mb limit`)
    }

    await this.primaryDriver.upsertFile(fileName, content, !!options.recordRevision)
    this.events.emit('changed', fileName)
    await this._invalidateFile(fileName)

    if (options.syncDbToDisk) {
      await this.cache.sync(JSON.stringify({ rootFolder, botId: this.options.botId }))
    }
  }

  async upsertFiles(rootFolder: string, content: FileContent[], options?: UpsertOptions): Promise<void> {
    await Promise.all(content.map(c => this.upsertFile(rootFolder, c.name, c.content)))
  }

  public async exportToDirectory(directory: string, excludes?: string | string[]): Promise<string[]> {
    const allFiles = await this.directoryListing('./', '*.*', excludes, true)

    for (const file of allFiles) {
      const content = await this.primaryDriver.readFile(this._normalizeFileName('./', file))
      const outPath = path.join(directory, file)
      mkdirp.sync(path.dirname(outPath))
      await fse.writeFile(outPath, content)
    }

    return allFiles
  }

  public async importFromDirectory(directory: string) {
    const filenames = await this.diskDriver.absoluteDirectoryListing(directory)

    const files = filenames.map(file => {
      return {
        name: file,
        content: fse.readFileSync(path.join(directory, file))
      } as FileContent
    })

    await this.upsertFiles('/', files, { ignoreLock: true })
  }

  public async exportToArchiveBuffer(excludes?: string | string[], replaceContent?: ReplaceContent): Promise<Buffer> {
    const tmpDir = tmp.dirSync({ unsafeCleanup: true })

    try {
      const outFiles = await this.exportToDirectory(tmpDir.name, excludes)
      if (replaceContent) {
        await replace({ files: `${tmpDir.name}/**/*.json`, from: replaceContent.from, to: replaceContent.to })
      }

      const filename = path.join(tmpDir.name, 'archive.tgz')
      const archive = await createArchive(filename, tmpDir.name, outFiles)
      return await fse.readFile(archive)
    } finally {
      tmpDir.removeCallback()
    }
  }

  async readFileAsBuffer(rootFolder: string, file: string): Promise<Buffer> {
    if (this.isDirectoryGlob) {
      throw new Error("Ghost can't read or write under this scope")
    }

    const fileName = this._normalizeFileName(rootFolder, file)
    const cacheKey = this.bufferCacheKey(fileName)

    if (!(await this.cache.has(cacheKey))) {
      const value = await this.primaryDriver.readFile(fileName)
      await this.cache.set(cacheKey, value)
      return value
    }

    return this.cache.get<Buffer>(cacheKey)
  }

  async readFileAsString(rootFolder: string, file: string): Promise<string> {
    return (await this.readFileAsBuffer(rootFolder, file)).toString()
  }

  async readFileAsObject<T>(rootFolder: string, file: string): Promise<T> {
    const fileName = this._normalizeFileName(rootFolder, file)
    const cacheKey = this.objectCacheKey(fileName)

    if (!(await this.cache.has(cacheKey))) {
      const value = await this.readFileAsString(rootFolder, file)
      let obj
      try {
        obj = <T>JSON.parse(value)
      } catch (e) {
        try {
          jsonlintMod.parse(value)
        } catch (e) {
          throw new Error(`SyntaxError in your JSON: ${file}: \n ${e}`)
        }
      }
      await this.cache.set(cacheKey, obj)
      return obj
    }

    return this.cache.get<T>(cacheKey)
  }

  async fileExists(rootFolder: string, file: string): Promise<boolean> {
    const fileName = this._normalizeFileName(rootFolder, file)
    const cacheKey = this.objectCacheKey(fileName)

    try {
      if (await this.cache.has(cacheKey)) {
        return true
      }

      return this.primaryDriver.fileExists(fileName)
    } catch (err) {
      return false
    }
  }

  async deleteFile(rootFolder: string, file: string): Promise<void> {
    if (this.isDirectoryGlob) {
      throw new Error("Ghost can't read or write under this scope")
    }

    const fileName = this._normalizeFileName(rootFolder, file)
    await this.primaryDriver.deleteFile(fileName, true)
    this.events.emit('changed', fileName)
    await this._invalidateFile(fileName)
  }

  async renameFile(rootFolder: string, fromName: string, toName: string): Promise<void> {
    const fromPath = this._normalizeFileName(rootFolder, fromName)
    const toPath = this._normalizeFileName(rootFolder, toName)

    await this.primaryDriver.moveFile(fromPath, toPath)
  }

  async deleteFolder(folder: string): Promise<void> {
    if (this.isDirectoryGlob) {
      throw new Error("Ghost can't read or write under this scope")
    }

    const folderName = this._normalizeFolderName(folder)
    await this.primaryDriver.deleteDir(folderName)
  }

  async directoryListing(
    rootFolder: string,
    fileEndingPattern: string = '*.*',
    excludes?: string | string[],
    includeDotFiles?: boolean,
    options: DirectoryListingOptions = {}
  ): Promise<string[]> {
    try {
      const files = await this.primaryDriver.directoryListing(this._normalizeFolderName(rootFolder), {
        excludes,
        includeDotFiles,
        ...options
      })

      return (files || []).filter(
        minimatch.filter(fileEndingPattern, { matchBase: true, nocase: true, noglobstar: false, dot: includeDotFiles })
      )
    } catch (err) {
      if (err && err.message && err.message.includes('ENOENT')) {
        return []
      }
      throw new VError(err, `Could not list directory under ${rootFolder}`)
    }
  }

  onFileChanged(callback: (filePath: string) => void): ListenHandle {
    const cb = file => callback && callback(file)
    this.events.on('changed', cb)
    return { remove: () => this.events.off('changed', cb) }
  }
}
