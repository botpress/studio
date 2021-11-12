import * as sdk from 'botpress/sdk'
import { Migration, MigrationOpts } from 'core/migration'
import fse, { WriteStream } from 'fs-extra'
import _ from 'lodash'
import path from 'path'
import { Stream } from 'stream'
import tar from 'tar'
import tmp from 'tmp'

export const MODELS_DIR = './models'
const MAX_MODELS_TO_KEEP = 2

interface ModelId {
  specificationHash: string // represents the nlu engine that was used to train the model
  contentHash: string // represents the intent and entity definitions the model was trained with
  seed: number // number to seed the random number generators used during nlu training
  languageCode: string // language of the model
}

interface Model {
  id: ModelId
  startedAt: Date
  finishedAt: Date
  data: {
    input: string
    output: string
  }
}

function makeFileName(hash: string, lang: string): string {
  return `${hash}.${lang}.model`
}

async function pruneModels(ghost: sdk.ScopedGhostService, languageCode: string): Promise<void | void[]> {
  const models = await listModelsForLang(ghost, languageCode)
  if (models.length > MAX_MODELS_TO_KEEP) {
    return Promise.map(models.slice(MAX_MODELS_TO_KEEP), file => ghost.deleteFile(MODELS_DIR, file))
  }
}

async function listModelsForLang(ghost: sdk.ScopedGhostService, languageCode: string): Promise<string[]> {
  const endingPattern = makeFileName('*', languageCode)
  return ghost.directoryListing(MODELS_DIR, endingPattern, undefined, undefined, {
    sortOrder: { column: 'modifiedOn', desc: true }
  })
}

async function getModel(ghost: sdk.ScopedGhostService, hash: string, lang: string): Promise<Model | undefined> {
  const fname = makeFileName(hash, lang)
  if (!(await ghost.fileExists(MODELS_DIR, fname))) {
    return
  }
  const buffStream = new Stream.PassThrough()
  buffStream.end(await ghost.readFileAsBuffer(MODELS_DIR, fname))
  const tmpDir = tmp.dirSync({ unsafeCleanup: true })

  const tarStream = tar.x({ cwd: tmpDir.name, strict: true }, ['model']) as WriteStream
  buffStream.pipe(tarStream)
  await new Promise(resolve => tarStream.on('close', resolve))

  const modelBuff = await fse.readFile(path.join(tmpDir.name, 'model'))
  let mod
  try {
    mod = JSON.parse(modelBuff.toString())
  } catch (err) {
    await ghost.deleteFile(MODELS_DIR, fname)
  } finally {
    tmpDir.removeCallback()
    return mod
  }
}

async function saveModel(ghost: sdk.ScopedGhostService, model: Model, hash: string): Promise<void | void[]> {
  const serialized = JSON.stringify(model)
  const modelName = makeFileName(hash, model.id.languageCode)
  const tmpDir = tmp.dirSync({ unsafeCleanup: true })
  const tmpFileName = path.join(tmpDir.name, 'model')
  await fse.writeFile(tmpFileName, serialized)

  const archiveName = path.join(tmpDir.name, modelName)
  await tar.create(
    {
      file: archiveName,
      cwd: tmpDir.name,
      portable: true,
      gzip: true
    },
    ['model']
  )
  const buffer = await fse.readFile(archiveName)
  await ghost.upsertFile(MODELS_DIR, modelName, buffer)
  tmpDir.removeCallback()
  return pruneModels(ghost, model.id.languageCode)
}

const migration: Migration = {
  info: {
    description: 'Prune and compress old models',
    target: 'bot',
    type: 'content'
  },
  up: async ({
    botService,
    ghostService,
    metadata: { botId, botConfig, isDryRun }
  }: MigrationOpts): Promise<sdk.MigrationResult> => {
    let hasChanges = false

    const ghost = ghostService.forBot(botId)

    await Promise.mapSeries(botConfig.languages, async lang => {
      await pruneModels(ghost, lang)
      const modNames = await listModelsForLang(ghost, lang)

      return Promise.map(modNames, async mod => {
        try {
          const model: any = await ghost.readFileAsObject(MODELS_DIR, mod)
          hasChanges = true

          if (!isDryRun) {
            if (!model.hash) {
              return ghost.deleteFile(MODELS_DIR, mod) // model is really outdated
            }

            return saveModel(ghost, model, model.hash) // Triggers model compression
          }
        } catch (err) {
          // model is probably an archive
          return
        }
      })
    })

    return { success: true, hasChanges }
  },

  down: async ({ logger }: MigrationOpts): Promise<sdk.MigrationResult> => {
    logger.warn(`No down migration written for ${path.basename(__filename)}`)
    return { success: true, hasChanges: false }
  }
}

export default migration
