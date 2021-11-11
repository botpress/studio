import * as sdk from 'botpress/sdk'
import { container } from 'core/app/inversify/app.inversify'
import { TYPES } from 'core/app/types'
import { BotService } from 'core/bots'
import { GhostService } from 'core/bpfs'
import { ConfigProvider } from 'core/config'
import Database from 'core/database'
import { BotMigrationService } from 'core/migration'
import fse from 'fs-extra'
import glob from 'glob'
import { Container, inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import path from 'path'
import semver from 'semver'

export const types = {
  config: 'Config Changes',
  content: 'Content Changes'
}

export interface MigrationEntry {
  initialVersion: string
  targetVersion: string
  details: string | string[]
  created_at: any
}

@injectable()
export class MigrationService {
  /** This is the version we want to migrate to (either up or down) */
  public targetVersion: string

  public botService!: BotService
  public loadedMigrations: { [filename: string]: Migration } = {}
  public botMigration!: BotMigrationService

  constructor(
    @tagged('name', 'Migration')
    @inject(TYPES.Logger)
    private logger: sdk.Logger,
    @inject(TYPES.Database) private database: Database,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.GhostService) private bpfs: GhostService
  ) {
    this.botMigration = new BotMigrationService(this, logger, configProvider, bpfs)
    this.targetVersion = process.BOTPRESS_VERSION
  }

  public async getMigrationOpts(metadata: MigrationMetadata): Promise<MigrationOpts> {
    return {
      ghostService: this.bpfs,
      logger: this.logger,
      botService: this.botService,
      configProvider: this.configProvider,
      database: this.database,
      inversify: container,
      metadata
    }
  }

  public getAllMigrations(): MigrationFile[] {
    const migrations = this._getMigrations(path.join(__dirname, '../../migrations'), true)

    return migrations.map(file => {
      if (!this.loadedMigrations[file.filename]) {
        this.loadedMigrations[file.filename] = require(file.location).default
      }

      return { ...file, info: this.loadedMigrations[file.filename].info }
    })
  }

  private _getMigrations(rootPath: string, assertExists = false): MigrationFile[] {
    if (assertExists && !fse.existsSync(rootPath)) {
      throw new Error(`The migration directory '${rootPath}' does not exists`)
    }

    return _.orderBy(
      glob.sync('**/*.js', { cwd: rootPath }).map(filepath => {
        const [rawVersion, timestamp, title] = path.basename(filepath).split('-')
        return {
          filename: path.basename(filepath),
          version: semver.valid(rawVersion.replace(/_/g, '.')) as string,
          title: (title || '').replace(/\.js$/i, ''),
          date: Number(timestamp),
          location: path.join(rootPath, filepath)
        }
      }),
      'date'
    )
  }
}

export interface MigrationFile {
  date: number
  version: string
  location: string
  filename: string
  title: string
  info: MigrationInfo
}

interface MigrationInfo {
  description: string
  target?: MigrationTarget
  type: MigrationType
}

export interface MigrationOpts {
  ghostService: GhostService
  logger: sdk.Logger
  botService: BotService
  configProvider: ConfigProvider
  database: Database
  inversify: Container
  metadata: MigrationMetadata
}

export type MigrationType = 'database' | 'config' | 'content'
export type MigrationTarget = 'bot'

export interface Migration {
  info: MigrationInfo
  up: (opts: MigrationOpts) => Promise<MigrationResult>
  down?: (opts: MigrationOpts) => Promise<MigrationResult>
}

export interface MigrationResult {
  /** Indicates if the migration ran successfully or not, can be optional if no changes or in a dry run */
  success?: boolean
  /** Indicates if the migration would change something (in a dry run) or if it did change something (not in a dry run)  */
  hasChanges?: boolean
  /** Optional message if there was an error */
  message?: string
}

export interface MigrationMetadata {
  botId: string
  botConfig: sdk.BotConfig
  /** On a dry run, we only indicate if the migration would need to be executed */
  isDryRun?: boolean
}
