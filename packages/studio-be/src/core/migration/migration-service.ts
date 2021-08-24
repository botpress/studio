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
  database: 'Database Changes',
  config: 'Config File Changes',
  content: 'Changes to Content Files (*.json)'
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

  public async getMigrationOpts(metadata?: sdk.MigrationMetadata): Promise<MigrationOpts> {
    return {
      ghostService: this.bpfs,
      logger: this.logger,
      botService: this.botService,
      configProvider: this.configProvider,
      database: this.database,
      inversify: container,
      metadata: metadata || {}
    }
  }

  public getAllMigrations(): MigrationFile[] {
    const coreMigrations = this._getMigrations(path.join(__dirname, '../../migrations'), true)

    const migrations = [...coreMigrations]
    migrations.map(file => {
      if (!this.loadedMigrations[file.filename]) {
        this.loadedMigrations[file.filename] = require(file.location).default
      }
    })

    return migrations
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

  public filterMigrations = (
    files: MigrationFile[],
    currentVersion: string,
    { isDown, type, target }: { isDown?: boolean; type?: MigrationType; target?: MigrationTarget } = {
      isDown: false,
      type: undefined,
      target: undefined
    }
  ) => {
    const comparator = isDown
      ? `>${this.targetVersion} <= ${currentVersion}`
      : `>${currentVersion} <= ${this.targetVersion}`

    const filteredFiles = files.filter(file => semver.satisfies(file.version, comparator))

    if (_.isEmpty(this.loadedMigrations)) {
      return filteredFiles
    }

    return filteredFiles.filter(file => {
      const content = this.loadedMigrations[file.filename]

      return (
        ((isDown && content?.down) || (!isDown && content?.up)) &&
        (type === undefined || type === content?.info.type) &&
        (target === undefined || target === content?.info.target)
      )
    })
  }
}

export interface MigrationFile {
  date: number
  version: string
  location: string
  filename: string
  title: string
}

export interface MigrationOpts {
  ghostService: GhostService
  logger: sdk.Logger
  botService: BotService
  configProvider: ConfigProvider
  database: Database
  inversify: Container
  metadata: sdk.MigrationMetadata
}

export type MigrationType = 'database' | 'config' | 'content'
export type MigrationTarget = 'core' | 'bot'

export interface Migration {
  info: {
    description: string
    target?: MigrationTarget
    type: MigrationType
  }
  up: (opts: MigrationOpts) => Promise<sdk.MigrationResult>
  down?: (opts: MigrationOpts) => Promise<sdk.MigrationResult>
}
