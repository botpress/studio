import 'bluebird-global'
import * as sdk from 'botpress/sdk'
import {
  FileDefinition,
  FileTypes,
  EditableFile,
  FilePermissions,
  FilesDS,
  FileType,
  TypingDefinitions
} from 'common/code-editor'
import { GhostService } from 'core/bpfs'
import fs from 'fs'
import _ from 'lodash'
import path from 'path'

import { assertValidFilename, buildRestrictedProcessVars, getBuiltinExclusion, getFileLocation } from './utils'

export const FILENAME_REGEX = /^[0-9a-zA-Z_\-.]+$/

export class Editor {
  private _botId!: string
  private _typings!: TypingDefinitions

  constructor(private bpfs: GhostService, private logger: sdk.Logger) {}

  forBot(botId: string) {
    this._botId = botId
    return this
  }

  async getAllFiles(permissions: FilePermissions, listBuiltin?: boolean): Promise<FilesDS> {
    const files: FilesDS = {}

    await Promise.mapSeries(Object.keys(permissions), async type => {
      const userPermissions = permissions[type]
      if (userPermissions.read) {
        files[type] = await this.loadFiles(userPermissions.type, this._botId, listBuiltin)
      }
    })

    return files
  }

  async fileExists(file: EditableFile): Promise<boolean> {
    const { folder, filename } = getFileLocation(file)
    return this.bpfs.forBot(this._botId).fileExists(folder, filename)
  }

  async readFileContent(file: EditableFile): Promise<string> {
    const { folder, filename } = getFileLocation(file)
    return this.bpfs.forBot(this._botId).readFileAsString(folder, filename)
  }

  async readFileBuffer(file: EditableFile): Promise<Buffer> {
    const { folder, filename } = getFileLocation(file)
    return this.bpfs.forBot(this._botId).readFileAsBuffer(folder, filename)
  }

  async saveFile(file: EditableFile): Promise<void> {
    const shouldSyncToDisk = FileTypes[file.type].ghost.shouldSyncToDisk
    const { folder, filename } = getFileLocation(file)

    return this.bpfs.forBot(this._botId).upsertFile(folder, filename, file.content!, {
      syncDbToDisk: shouldSyncToDisk
    })
  }

  async loadFiles(fileTypeId: string, botId: string, listBuiltin?: boolean): Promise<EditableFile[]> {
    const def: FileDefinition = FileTypes[fileTypeId]
    const { baseDir, dirListingAddFields, dirListingExcluded } = def.ghost

    let fileExt = '*.*'
    if (def.isJSON !== undefined) {
      fileExt = def.isJSON ? '*.json' : '*.js'
    }

    const baseExcluded = listBuiltin ? [] : getBuiltinExclusion()
    const excluded = [...baseExcluded, ...(dirListingExcluded ?? [])]

    const files = def.filenames
      ? def.filenames
      : await this.bpfs.forBot(botId).directoryListing(baseDir, fileExt, excluded, true)

    return Promise.map(files, async (filepath: string) => ({
      name: path.basename(filepath),
      type: fileTypeId as FileType,
      location: filepath,
      content: undefined,
      botId,
      ...(dirListingAddFields && dirListingAddFields(filepath))
    }))
  }

  async deleteFile(file: EditableFile): Promise<void> {
    const fileDef = FileTypes[file.type]
    if (fileDef.canDelete && !fileDef.canDelete(file)) {
      throw new Error('This file cannot be deleted.')
    }

    const { folder, filename } = getFileLocation(file)
    await this.bpfs.forBot(this._botId).deleteFile(folder, filename)
  }

  async renameFile(file: EditableFile, newName: string): Promise<void> {
    assertValidFilename(newName)

    const { folder, filename } = getFileLocation(file)
    const newFilename = filename.replace(filename, newName)

    const ghost = this.bpfs.forBot(this._botId)

    if (await ghost.fileExists(folder, newFilename)) {
      throw new Error('File already exists')
    }

    return ghost.renameFile(folder, filename, newFilename)
  }

  async readFile(name: string, filePath: string) {
    let fileContent = ''
    try {
      const typings = fs.readFileSync(filePath, 'utf-8')

      fileContent = typings.toString()
      if (name === 'botpress.d.ts' || name === 'botpress.runtime.d.ts') {
        fileContent = fileContent.replace("'botpress/sdk'", 'sdk').replace("'botpress/runtime-sdk'", 'sdk')
      }
    } catch (err) {
      this.logger.warn(`Couldn't load file ${filePath} `)
    }

    return { name, fileContent }
  }

  async loadTypings() {
    if (this._typings) {
      return this._typings
    }

    const ghost = this.bpfs.root()
    const botConfigSchema = await ghost.readFileAsString('/', 'bot.config.schema.json')
    const botpressConfigSchema = await ghost.readFileAsString('/', 'botpress.config.schema.json')

    const moduleTypings = await this.getModuleTypings()

    const files = [
      { name: 'node.d.ts', location: path.join(__dirname, '/../../typings/node.d.txt') },
      { name: 'botpress.d.ts', location: path.join(__dirname, '/../../sdk/botpress.d.txt') },
      { name: 'botpress.runtime.d.ts', location: path.join(__dirname, '/../../sdk/botpress.runtime.d.txt') },
      // Required so array.includes() can be used without displaying an error
      { name: 'es6include.d.ts', location: path.join(__dirname, '/../../typings/es6include.txt') }
    ]

    const content = await Promise.mapSeries(files, file => this.readFile(file.name, file.location))
    const localTypings = _.mapValues(_.keyBy(content, 'name'), 'fileContent')

    this._typings = {
      'process.d.ts': buildRestrictedProcessVars(),
      'bot.config.schema.json': botConfigSchema,
      'botpress.config.schema.json': botpressConfigSchema,
      ...localTypings,
      ...moduleTypings
    }

    return this._typings
  }

  async getModuleTypings() {
    const cwd = path.resolve(__dirname, '../../..')
    try {
      return _.reduce(
        fs.readdirSync(cwd),
        (result, dir) => {
          const pkgPath = path.join(cwd, dir, 'package.json')
          if (fs.existsSync(pkgPath)) {
            const moduleName = require(pkgPath).name
            const schemaPath = path.join(cwd, dir, 'assets/config.schema.json')
            result[`modules/${moduleName}/config.schema.json`] = fs.existsSync(schemaPath)
              ? fs.readFileSync(schemaPath, 'utf-8')
              : '{}'
          }
          return result
        },
        {}
      )
    } catch (e) {
      this.logger.attachError(e).error('Error reading typings')
      return {}
    }
  }
}
