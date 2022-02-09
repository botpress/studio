import { KnexExtended, KnexExtension } from 'botpress/sdk'
import Knex from 'knex'
import moment from 'moment'
import { VError } from 'verror'

export const patchKnex = (knex: Knex): KnexExtended => {
  const isLite = knex.client.config.client === 'sqlite3'
  const location = isLite ? knex.client.connectionSettings.filename : undefined

  const dateParse = (exp: string): Knex.Raw => {
    return isLite ? knex.raw(`strftime('%Y-%m-%dT%H:%M:%fZ', ${exp})`) : knex.raw(exp)
  }

  const dateFormat = (date: Date) => {
    const iso = moment(date).toDate().toISOString()
    return dateParse(`'${iso}'`)
  }

  const columnOrDateFormat = (colOrDate: Knex.ColumnOrDate) => {
    if ((<Knex.Sql>colOrDate).sql) {
      return (<Knex.Sql>colOrDate).sql
    }

    if (typeof colOrDate === 'string') {
      return isLite ? dateParse(colOrDate) : `"${colOrDate}"`
    }

    return dateFormat(<Date>colOrDate)
  }

  const createTableIfNotExists = async (tableName: string, cb: Knex.KnexCallback): Promise<boolean> => {
    return knex.schema.hasTable(tableName).then((exists) => {
      if (exists) {
        return false
      }
      return knex.schema.createTable(tableName, cb).then(() => true)
    })
  }

  // only works for single insert because of SQLite
  const insertAndRetrieve = async <T>(
    tableName: string,
    data: any,
    returnColumns: string | string[] = 'id',
    idColumnName: string = 'id',
    trx?: Knex.Transaction
  ): Promise<T> => {
    throw new Error("The studio doesn't support this method")
  }

  const binary: Knex.Binary = {
    set: (data: string | Buffer): any => {
      if (isLite || typeof data !== 'string') {
        return data
      }

      return new Buffer(data, 'utf8')
    }
  }

  const date: Knex.Date = {
    set: (date?: Date) => (date ? date.toISOString() : undefined),
    get: (date) => new Date(date),

    format: dateFormat,
    now: () => (isLite ? knex.raw("strftime('%Y-%m-%dT%H:%M:%fZ', 'now')") : knex.raw('now()')),
    today: () => (isLite ? knex.raw('(date())') : knex.raw('(date(now()))')),
    isBefore: (d1: Knex.ColumnOrDate, d2: Knex.ColumnOrDate): Knex.Raw => {
      const exp1 = columnOrDateFormat(d1)
      const exp2 = columnOrDateFormat(d2)
      return knex.raw(`${exp1} < ${exp2}`)
    },

    isBeforeOrOn: (d1: Knex.ColumnOrDate, d2: Knex.ColumnOrDate): Knex.Raw => {
      const exp1 = columnOrDateFormat(d1)
      const exp2 = columnOrDateFormat(d2)
      return knex.raw(`${exp1} <= ${exp2}`)
    },

    isAfter: (d1: Knex.ColumnOrDate, d2: Knex.ColumnOrDate): Knex.Raw => {
      const exp1 = columnOrDateFormat(d1)
      const exp2 = columnOrDateFormat(d2)
      return knex.raw(`${exp1} > ${exp2}`)
    },

    isAfterOrOn: (d1: Knex.ColumnOrDate, d2: Knex.ColumnOrDate): Knex.Raw => {
      const exp1 = columnOrDateFormat(d1)
      const exp2 = columnOrDateFormat(d2)
      return knex.raw(`${exp1} >= ${exp2}`)
    },

    isBetween: (date: Knex.ColumnOrDate, betweenA: Knex.ColumnOrDate, betweenB: Knex.ColumnOrDate): Knex.Raw => {
      const exp1 = columnOrDateFormat(date)
      const exp2 = columnOrDateFormat(betweenA)
      const exp3 = columnOrDateFormat(betweenB)

      return knex.raw(`${exp1} BETWEEN ${exp2} AND ${exp3}`)
    },

    isSameDay: (d1: Knex.ColumnOrDate, d2: Knex.ColumnOrDate): Knex.Raw => {
      const exp1 = columnOrDateFormat(d1)
      const exp2 = columnOrDateFormat(d2)
      return knex.raw(`date(${exp1}) = date(${exp2})`)
    },

    hourOfDay: (date: Knex.ColumnOrDate): Knex.Raw => {
      const exp1 = columnOrDateFormat(date)
      return isLite ? knex.raw(`strftime('%H', ${exp1})`) : knex.raw(`to_char(${exp1}, 'HH24')`)
    }
  }

  const bool: Knex.Bool = {
    true: () => (isLite ? 1 : true),
    false: () => (isLite ? 0 : false),
    parse: (value) => (isLite ? !!value : value)
  }

  const json: Knex.Json = {
    set: (obj) => (isLite ? obj && JSON.stringify(obj) : obj),
    get: (obj) => (isLite ? obj && JSON.parse(obj) : obj)
  }

  const extensions: KnexExtension = {
    isLite,
    location,
    binary,
    date,
    json,
    bool,
    createTableIfNotExists,
    insertAndRetrieve
  }

  return Object.assign(knex, extensions)
}
