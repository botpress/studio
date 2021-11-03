import { KnexExtended, Logger } from 'botpress/sdk'
import { TYPES } from 'core/types'
import { mkdirpSync } from 'fs-extra'
import { inject, injectable, tagged } from 'inversify'
import Knex from 'knex'
import _ from 'lodash'
import path from 'path'

import { patchKnex } from './helpers'

export type DatabaseType = 'postgres' | 'sqlite'

@injectable()
export default class Database {
  knex!: KnexExtended

  public constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'Database')
    private logger: Logger
  ) {}

  async initialize(databaseType?: DatabaseType, databaseUrl?: string) {
    const logger = this.logger
    const { DATABASE_URL, DATABASE_POOL } = process.env

    let poolOptions = {
      log: message => logger.warn(`[pool] ${message}`)
    }

    try {
      const customPoolOptions = DATABASE_POOL ? JSON.parse(DATABASE_POOL) : {}
      poolOptions = { ...poolOptions, ...customPoolOptions }
    } catch (err) {
      this.logger.warn('Database pool option is not valid json')
    }

    if (DATABASE_URL) {
      if (!databaseType) {
        databaseType = DATABASE_URL.toLowerCase().startsWith('postgres') ? 'postgres' : 'sqlite'
      }
      if (!databaseUrl) {
        databaseUrl = DATABASE_URL
      }
    }

    const config: Knex.Config = {
      useNullAsDefault: true,
      log: {
        error: message => logger.error(`[knex] ${message}`),
        warn: message => logger.warn(`[knex] ${message}`),
        debug: message => logger.debug(`[knex] ${message}`)
      }
    }

    const dbLocation = databaseUrl ? databaseUrl : `${process.TEMP_LOCATION}/storage/core.sqlite`
    mkdirpSync(path.dirname(dbLocation))

    Object.assign(config, {
      client: 'sqlite3',
      connection: { filename: dbLocation },
      pool: {
        afterCreate: (conn, cb) => {
          conn.run('PRAGMA foreign_keys = ON', cb)
        },
        ...poolOptions
      }
    })

    this.knex = patchKnex(Knex(config))
  }
}
