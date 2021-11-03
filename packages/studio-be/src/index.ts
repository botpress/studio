global['NativePromise'] = global.Promise

import fs from 'fs'
import fse from 'fs-extra'
import path from 'path'
import yn from 'yn'

import { getAppDataPath } from './core/misc/app_data'
import { Debug } from './debug'
import getos from './getos'
import metadata from './metadata.json'

const printPlainError = err => {
  /* eslint-disable no-console */
  console.log('Error starting botpress')
  console.log(err)
  console.log(err.message)
  console.log('---STACK---')
  console.log(err.stack)
}

global.DEBUG = Debug
global.printErrorDefault = printPlainError

const originalWrite = process.stdout.write

const shouldDiscardError = message =>
  !![
    '[DEP0005]' // Buffer() deprecation warning
  ].find(e => message.indexOf(e) >= 0)

function stripDeprecationWrite(buffer: string, encoding: string, cb?: Function | undefined): boolean
function stripDeprecationWrite(buffer: string | Buffer, cb?: Function | undefined): boolean
function stripDeprecationWrite(this: Function): boolean {
  if (typeof arguments[0] === 'string' && shouldDiscardError(arguments[0])) {
    return (arguments[2] || arguments[1])()
  }

  return originalWrite.apply(this, (arguments as never) as [string])
}

if (process.env.APP_DATA_PATH) {
  process.APP_DATA_PATH = process.env.APP_DATA_PATH
} else {
  process.APP_DATA_PATH = getAppDataPath()
}

process.IS_FAILSAFE = yn(process.env.BP_FAILSAFE) || false
process.LOADED_MODULES = {}

process.STUDIO_LOCATION = process.pkg
  ? path.dirname(process.execPath) // We point at the binary path
  : path.resolve(__dirname) // e.g. /dist/..

process.PROJECT_LOCATION = process.env.PROJECT_LOCATION || process.STUDIO_LOCATION

process.stderr.write = stripDeprecationWrite

process.on('unhandledRejection', (err: any) => {
  console.trace(err)
  global.printErrorDefault(err)

  if (!process.IS_FAILSAFE) {
    process.exit(1)
  }
})

process.on('uncaughtException', err => {
  global.printErrorDefault(err)
  if (!process.IS_FAILSAFE) {
    process.exit(1)
  }
})

try {
  require('dotenv').config({ path: path.resolve(process.PROJECT_LOCATION, '.env') })
  process.core_env = process.env as BotpressEnvironmentVariables

  let defaultVerbosity = process.IS_PRODUCTION ? 0 : 2
  if (!isNaN(Number(process.env.VERBOSITY_LEVEL))) {
    defaultVerbosity = Number(process.env.VERBOSITY_LEVEL)
  }

  process.STUDIO_VERSION = metadata.version
  process.DEV_BRANCH = metadata['devBranch']
  process.BOTPRESS_VERSION = process.env.BOTPRESS_VERSION!

  require('yargs')
    .command(
      ['serve', '$0'],
      'Start the studio. If the bot doesnt exist, it will be created',
      {
        dataFolder: {
          alias: ['d', 'data'],
          description: 'Starts Botpress in standalone mode on that specific data folder',
          type: 'string'
        },
        template: {
          description: 'If bot doesnt exist, it will use this template',
          type: 'string'
        }
      },
      async argv => {
        const botId = argv._?.[0]

        process.BOT_LOCATION = path.resolve(botId)
        process.TEMP_LOCATION = path.resolve(process.BOT_LOCATION, '.state')
        process.BOT_ID = path.basename(botId)
        process.TEMPLATE_ID = argv.template || 'empty-bot'

        // console.error(
        //   "Data folder must be provided. Either set the environment variable 'BP_DATA_FOLDER' or start the binary with 'studio.exe -d /path/to/data' "
        // )
        // process.exit(1)

        process.VERBOSITY_LEVEL = defaultVerbosity
        process.distro = await getos()

        require('./core/app/bootstrap')
      }
    )

    .help().argv
} catch (err) {
  global.printErrorDefault(err)
}
