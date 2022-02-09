import { DirectoryListingOptions, NLU } from 'botpress/sdk'
import { QnaEntry, QnaItem } from 'common/typings'
import { sanitizeFileName } from 'common/utils'
import { validate } from 'joi'
import _ from 'lodash'
import moment from 'moment'
import multer from 'multer'
import { customAlphabet, nanoid } from 'nanoid'
import path from 'path'
import { StudioServices } from 'studio/studio-router'
import { Instance } from 'studio/utils/bpfs'
import { CustomStudioRouter } from 'studio/utils/custom-studio-router'

import { importQuestions, prepareExport, prepareImport } from './transfer'
import { QnaDefSchema } from './validation'

const QNA_DIR = 'qna'
const INTENT_DIR = 'intents'

interface FilteringOptions {
  questionFilter: string
  contextsFilter: string[]
}

export class QNARouter extends CustomStudioRouter {
  private jsonUploadStatuses = {}

  constructor(services: StudioServices) {
    super('QNA', services)
  }

  private _normalizeQuestion(question: string): string {
    return question
      .replace(/[\r\n]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  private _makeIntentId(qnaId: string): string {
    return `__qna__${qnaId}`
  }

  private _makeIntentFromQna(qnaItem: QnaItem): NLU.IntentDefinition {
    const utterances = {}
    for (const lang in qnaItem.data.questions) {
      utterances[lang] = qnaItem.data.questions[lang].map(this._normalizeQuestion).filter(Boolean)
    }
    return {
      name: this._makeIntentId(qnaItem.id),
      contexts: qnaItem.data.contexts,
      utterances,
      slots: []
    }
  }

  private _makeID(qna: QnaEntry) {
    const firstQuestion = qna.questions[Object.keys(qna.questions)[0]][0]
    const safeId = customAlphabet('1234567890abcdefghijklmnopqrsuvwxyz', length)()
    return `${safeId}_${sanitizeFileName(firstQuestion).replace(/^_+/, '').substring(0, 50).replace(/_+$/, '')}`
  }

  private applyFilters(qnaItem: QnaItem, options: FilteringOptions): boolean {
    const qFilter = options.questionFilter.toLowerCase()
    const { questions, contexts } = qnaItem.data

    const contextMatches = !!_.intersection(contexts, options.contextsFilter).length
    if (!qFilter) {
      return contextMatches
    }

    const idMachesQuestionFilter = qnaItem.id.includes(qFilter)
    const contentMatchesQuestionFilter = JSON.stringify(Object.values(questions)).toLowerCase().includes(qFilter)

    return (idMachesQuestionFilter || contentMatchesQuestionFilter) && contextMatches
  }

  setupRoutes() {
    const router = this.router

    router.get(
      '/questions',
      this.needPermissions('read', 'module.qna'),
      this.asyncMiddleware(async (req, res) => {
        try {
          const {
            query: { questionFilter = '', contextsFilter = [], limit = 50, offset = 0 }
          } = req

          const options: DirectoryListingOptions = { sortOrder: { column: 'filePath', desc: true } }
          const qnas = await Instance.directoryListing(QNA_DIR, options).then((filePaths) => {
            return Promise.map(filePaths, (filePath) =>
              Instance.readFile(path.join(QNA_DIR, filePath)).then((buf) => JSON.parse(buf.toString()) as QnaItem)
            )
          })

          const filteredItems = qnas.filter((qnaItem) =>
            this.applyFilters(qnaItem, <FilteringOptions>{ questionFilter, contextsFilter })
          )

          const pagedItems = filteredItems.slice(+offset, +offset + +limit)
          res.send({ items: pagedItems, count: filteredItems.length })
        } catch (e) {
          this.logger.attachError(e).error('Error listing questions')
          res.status(500).send(e.message || 'Error')
        }
      })
    )

    router.post(
      '/questions',
      this.needPermissions('write', 'module.qna'),
      this.asyncMiddleware(async (req, res) => {
        const qnaEntry = req.body as QnaEntry
        const id = this._makeID(qnaEntry)
        const qnaItem: QnaItem = { data: qnaEntry, id }

        await Instance.upsertFile(path.join(QNA_DIR), JSON.stringify(qnaItem, undefined, 2))

        if (qnaEntry.enabled) {
          const intentDef = this._makeIntentFromQna(qnaItem)
          // TODO assess this hard coding when we move qna to nlu dir
          await Instance.upsertFile(
            path.join('intents', sanitizeFileName(intentDef.name)),
            JSON.stringify(intentDef, undefined, 2)
          )
        }

        res.send([id])
      })
    )

    router.get(
      '/questions/:id',
      this.needPermissions('read', 'module.qna'),
      this.asyncMiddleware(async (req, res) => {
        const question = await Instance.readFile(path.join(QNA_DIR, req.params.id, '.json')).then(
          (buff) => JSON.parse(buff.toString()) as QnaItem
        )
        res.send(question)
      })
    )

    router.post(
      '/questions/:id',
      this.needPermissions('write', 'module.qna'),
      this.asyncMiddleware(async (req, res, next) => {
        const qnaEntry = (await validate(req.body, QnaDefSchema)) as QnaEntry
        const qnaItem: QnaItem = { data: qnaEntry, id: req.params.id }

        await Instance.upsertFile(path.join(QNA_DIR), JSON.stringify(qnaItem, undefined, 2))

        res.send(qnaItem)
      })
    )

    router.post(
      '/questions/:id/delete',
      this.needPermissions('write', 'module.qna'),
      this.asyncMiddleware(async (req, res) => {
        await Instance.deleteFile(path.join(QNA_DIR, req.params.id, '.json'))
        res.sendStatus(200)
      })
    )

    router.post(
      '/questions/:id/convert',
      this.needPermissions('write', 'module.qna'),
      this.asyncMiddleware(async (req, res) => {
        const intentId = this._makeIntentId(req.params.id)
        const intentPath = path.join(INTENT_DIR, intentId, '.json')
        if (!(await Instance.fileExists(intentPath))) {
          return res.sendStatus(404)
        }

        await Promise.all([
          Instance.moveFile(intentPath, intentPath.replace('__qna__', '')),
          await Instance.deleteFile(path.join(QNA_DIR, req.params.id, '.json'))
        ])

        res.sendStatus(200)
      })
    )

    router.get(
      '/export',
      this.needPermissions('read', 'module.qna'),
      this.asyncMiddleware(async (req, res) => {
        const { storage } = await this.qnaService.getBotStorage(req.params.botId)
        //
        const data: string = await prepareExport(storage, this.cmsService)

        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Content-disposition', `attachment; filename=qna_${moment().format('DD-MM-YYYY')}.json`)
        res.end(data)
      })
    )

    router.post(
      '/import',
      this.needPermissions('write', 'module.qna'),
      upload.single('file'),
      this.asyncMiddleware(async (req, res) => {
        const uploadStatusId = nanoid()
        res.send(uploadStatusId)

        const { storage } = await this.qnaService.getBotStorage(req.params.botId)

        if (req.body.action === 'clear_insert') {
          updateUploadStatus(uploadStatusId, 'Deleting existing questions')
          const questions = await storage.fetchQNAs()

          await storage.delete(questions.map(({ id }) => id))
          updateUploadStatus(uploadStatusId, 'Deleted existing questions')
        }

        try {
          const importData = await prepareImport(JSON.parse((req as any).file.buffer))

          await importQuestions(importData, storage, this.cmsService, updateUploadStatus, uploadStatusId)
          updateUploadStatus(uploadStatusId, 'Completed')
        } catch (e) {
          this.logger.attachError(e).error('JSON Import Failure')
          updateUploadStatus(uploadStatusId, `Error: ${e.message}`)
        }
      })
    )

    // TODO remove, move logic in front end
    router.get(
      '/contentElementUsage',
      this.needPermissions('read', 'module.qna'),
      this.asyncMiddleware(async (req, res) => {
        const { storage } = await this.qnaService.getBotStorage(req.params.botId)
        const usage = await storage.getContentElementUsage()
        res.send(usage)
      })
    )

    // TODO move logic in FE
    const upload = multer()
    router.post(
      '/analyzeImport',
      this.needPermissions('write', 'module.qna'),
      upload.single('file'),
      this.asyncMiddleware(async (req, res) => {
        const { storage } = await this.qnaService.getBotStorage(req.params.botId)
        const cmsIds = await storage.getAllContentElementIds()
        // @ts-ignore
        const importData = await prepareImport(JSON.parse(req.file.buffer))

        res.send({
          qnaCount: await storage.count(),
          cmsCount: (cmsIds && cmsIds.length) || 0,
          fileQnaCount: (importData.questions && importData.questions.length) || 0,
          fileCmsCount: (importData.content && importData.content.length) || 0
        })
      })
    )

    // TODO remove
    router.get(
      '/json-upload-status/:uploadStatusId',
      this.needPermissions('read', 'module.qna'),
      this.asyncMiddleware(async (req, res) => {
        res.end(this.jsonUploadStatuses[req.params.uploadStatusId])
      })
    )

    const updateUploadStatus = (uploadStatusId: string, status: string) => {
      if (uploadStatusId) {
        this.jsonUploadStatuses[uploadStatusId] = status
      }
    }
  }
}
