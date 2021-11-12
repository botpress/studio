import * as sdk from 'botpress/sdk'
import chalk from 'chalk'
import { GhostService } from 'core/bpfs'
import { ConfigProvider } from 'core/config'
import { PersistedConsoleLogger, centerText } from 'core/logger'
import _ from 'lodash'
import semver from 'semver'
import stripAnsi from 'strip-ansi'
import yn from 'yn'

import { MigrationEntry, MigrationFile, MigrationService, types } from '.'

const debug = DEBUG('migration')

export class BotMigrationService {
  constructor(
    private migService: MigrationService,
    private logger: sdk.Logger,
    private configProvider: ConfigProvider,
    private bpfs: GhostService
  ) {}

  async executeMissingBotMigrations(botId: string, currentVersion: string) {
    debug.forBot(botId, 'Checking missing migrations for bot ', { botId, currentVersion })

    const missingMigrations = await this.getMissingMigrations(botId, this.migService.getAllMigrations())
    if (!missingMigrations.length) {
      return
    }

    const logs: string[] = []
    const captureLogger = PersistedConsoleLogger.listenForAllLogs((level, message) => {
      logs.push(`[${level}] ${stripAnsi(message)}`)
    }, botId)

    try {
      await this.executeBotMigrations(botId, missingMigrations, currentVersion)
    } finally {
      captureLogger.dispose()

      await this.saveBotMigrationLog(botId, {
        initialVersion: currentVersion,
        targetVersion: this.migService.targetVersion,
        created_at: new Date(),
        details: logs
      })
    }
  }

  async saveBotMigrationLog(botId: string, entry: MigrationEntry) {
    const entries: MigrationEntry[] = [entry]

    if (await this.bpfs.forBot(botId).fileExists('/', 'migrations.json')) {
      const pastMigrations = await this.bpfs.forBot(botId).readFileAsObject<MigrationEntry[]>('/', 'migrations.json')
      entries.push(...pastMigrations)
    }

    await this.bpfs.forBot(botId).upsertFile('/', 'migrations.json', JSON.stringify(entries, undefined, 2))
  }

  private async getMissingMigrations(botId: string, migrations: MigrationFile[]): Promise<MigrationFile[]> {
    const botConfig = await this.configProvider.getBotConfig(botId)
    const opts = await this.migService.getMigrationOpts({ botId, botConfig, isDryRun: true })

    const missing = await Promise.mapSeries(migrations, async migration => {
      try {
        const result = await this.migService.loadedMigrations[migration.filename].up(opts)
        if (result.hasChanges) {
          return migration
        }
      } catch (err) {
        this.logger
          .forBot(botId)
          .attachError(err)
          .error(`There was an error while processing migration ${migration.title} for bot ${botId}`)
      }
    })

    return missing.filter(x => x !== undefined) as MigrationFile[]
  }

  private writeLabel(migrations: number, botId: string, version: string) {
    const configLabel = `(${version} => ${this.migService.targetVersion})`
    const changesLabel = `${migrations} change${migrations === 1 ? '' : 's'}`

    return chalk`{bold Migration${migrations === 1 ? '' : 's'} Required for ${botId}} ${configLabel} - ${changesLabel}`
  }

  private async executeBotMigrations(botId: string, migrations: MigrationFile[], configVersion: string) {
    const botConfig = await this.configProvider.getBotConfig(botId)
    const opts = await this.migService.getMigrationOpts({ botId, botConfig })
    let hasFailures = false

    const logger = this.logger.forBot(botId)

    logger.warn(this.writeLabel(migrations.length, botId, configVersion))

    await Promise.mapSeries(migrations, async ({ filename, info }, idx) => {
      const isLast = idx === migrations.length - 1
      const label = `${types[info.type]} - ${info.description} ${isLast ? '\n' : ''}`

      try {
        const result = await this.migService.loadedMigrations[filename].up(opts)
        debug.forBot(botId, 'Migration step finished', { filename, result })

        if (result.success) {
          logger.warn(`${chalk.green('[success]')} ${label}`)
        } else if (result.hasChanges) {
          logger.error(`${chalk.red('[failure]')} ${label}: ${result.message || ''}`)
          hasFailures = true
        }
      } catch (err) {
        logger.attachError(err).error(`${chalk.red('[failure]')} ${label}`)
        hasFailures = true
      }
    })

    if (hasFailures) {
      return this.logger.error(`[${botId}] Could not complete bot migration. It may behave unexpectedly.`)
    }

    await this.configProvider.mergeBotConfig(botId, { version: this.migService.targetVersion })
  }
}
