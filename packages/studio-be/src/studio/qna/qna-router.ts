import { QnaEntry } from 'common/typings'
import { validate } from 'joi'
import _ from 'lodash'
import moment from 'moment'
import multer from 'multer'
import nanoid from 'nanoid'
import { StudioServices } from 'studio/studio-router'
import { CustomStudioRouter } from 'studio/utils/custom-studio-router'

import { importQuestions, prepareExport, prepareImport } from './transfer'
import { QnaDefSchema } from './validation'

export class QNARouter extends CustomStudioRouter {
  private jsonUploadStatuses = {}

  constructor(services: StudioServices) {
    super('QNA', services)
  }

  setupRoutes() {
    const router = this.router

    router.get(
      '/questions',
      this.needPermissions('read', 'module.qna'),
      this.asyncMiddleware(async (req, res) => {
        try {
          const {
            query: { question = '', filteredContexts = [], limit, offset }
          } = req

          const { storage } = await this.qnaService.getBotStorage(req.params.botId)

          // @ts-ignore
          const items = await storage.getQuestions({ question, filteredContexts }, { limit, offset })
          res.send({ ...items })
        } catch (e) {
          this.logger.attachError(e).error('Error listing questions')
          res.status(500).send(e.message || 'Error')
        }
      })
    )

    router.post(
      '/questions',
      this.needPermissions('write', 'module.qna'),
      this.asyncMiddleware(async (req, res, next) => {
        try {
          const qnaEntry = (await validate(req.body, QnaDefSchema)) as QnaEntry
          const { storage } = await this.qnaService.getBotStorage(req.params.botId)
          const id = await storage.insert(qnaEntry)
          res.send([id])
        } catch (e) {
          next?.(new Error(e.message))
        }
      })
    )

    router.get(
      '/questions/:id',
      this.needPermissions('read', 'module.qna'),
      this.asyncMiddleware(async (req, res) => {
        try {
          const { storage } = await this.qnaService.getBotStorage(req.params.botId)
          const question = await storage.getQnaItem(req.params.id)
          res.send(question)
        } catch (e) {
          res.status(404).send(e.message || 'Error')
        }
      })
    )

    router.post(
      '/questions/:id',
      this.needPermissions('write', 'module.qna'),
      this.asyncMiddleware(async (req, res, next) => {
        const {
          query: { limit, offset, question, filteredContexts }
        } = req

        try {
          const qnaEntry = (await validate(req.body, QnaDefSchema)) as QnaEntry
          const { storage } = await this.qnaService.getBotStorage(req.params.botId)
          await storage.update(qnaEntry, req.params.id)

          // @ts-ignore
          const questions = await storage.getQuestions({ question, filteredContexts }, { limit, offset })
          res.send(questions)
        } catch (e) {
          next?.(new Error(e.message))
        }
      })
    )

    router.post(
      '/questions/:id/delete',
      this.needPermissions('write', 'module.qna'),
      this.asyncMiddleware(async (req, res) => {
        const {
          query: { limit, offset, question, filteredContexts }
        } = req

        try {
          const { storage } = await this.qnaService.getBotStorage(req.params.botId)
          await storage.delete(req.params.id)
          // @ts-ignore
          const questionsData = await storage.getQuestions({ question, filteredContexts }, { limit, offset })
          res.send(questionsData)
        } catch (e) {
          this.logger.attachError(e).error(`Could not delete QnA #${req.params.id}`)
          res.status(500).send(e.message || 'Error')
        }
      })
    )

    router.post(
      '/questions/:id/convert',
      this.needPermissions('write', 'module.qna'),
      this.asyncMiddleware(async (req, res, next) => {
        const {
          query: { limit, offset, question, filteredContexts }
        } = req

        try {
          const { storage } = await this.qnaService.getBotStorage(req.params.botId)
          await storage.convert(req.params.id)
          // @ts-ignore
          const questionsData = await storage.getQuestions({ question, filteredContexts }, { limit, offset })
          res.send(questionsData)
        } catch (e) {
          this.logger.attachError(e).error(`Could not convert QnA #${req.params.id}`)
          res.status(500).send(e.message || 'Error')
        }
      })
    )

    router.get(
      '/export',
      this.needPermissions('read', 'module.qna'),
      this.asyncMiddleware(async (req, res) => {
        const { storage } = await this.qnaService.getBotStorage(req.params.botId)
        const data: string = await prepareExport(storage, this.cmsService)

        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Content-disposition', `attachment; filename=qna_${moment().format('DD-MM-YYYY')}.json`)
        res.end(data)
      })
    )

    router.get(
      '/contentElementUsage',
      this.needPermissions('read', 'module.qna'),
      this.asyncMiddleware(async (req, res) => {
        const { storage } = await this.qnaService.getBotStorage(req.params.botId)
        const usage = await storage.getContentElementUsage()
        res.send(usage)
      })
    )

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

    router.get(
      '/json-upload-status/:uploadStatusId',
      this.needPermissions('read', 'module.qna'),
      this.asyncMiddleware(async (req, res) => {
        res.end(this.jsonUploadStatuses[req.params.uploadStatusId])
      })
    )

    router.get(
      '/questionsByTopic',
      this.needPermissions('read', 'module.qna'),
      this.asyncMiddleware(async (req, res) => {
        try {
          const { storage } = await this.qnaService.getBotStorage(req.params.botId)
          res.send(await storage.getCountByTopic())
        } catch (e) {
          res.status(500).send(e.message || 'Error')
        }
      })
    )

    const updateUploadStatus = (uploadStatusId: string, status: string) => {
      if (uploadStatusId) {
        this.jsonUploadStatuses[uploadStatusId] = status
      }
    }
  }
}
