import { ALL_BOTS } from 'common/utils'
import _ from 'lodash'
import multer from 'multer'
import path from 'path'
import { StudioServices } from 'studio/studio-router'
import { CustomStudioRouter } from 'studio/utils/custom-studio-router'

import { Editor } from './editor'
import { getPermissionsMw, validateFilePayloadMw, validateFileUploadMw } from './utils_router'

export class CodeEditorRouter extends CustomStudioRouter {
  constructor(services: StudioServices) {
    super('CodeEditor', services)
    this.setupRoutes()
  }

  setupRoutes() {
    const router = this.router
    const loadPermsMw = getPermissionsMw()

    const editor = new Editor(this.bpfs, this.logger)

    router.get(
      '/files',
      loadPermsMw,
      this.asyncMiddleware(async (req: any, res) => {
        if (!req.params.botId || req.params.botId === ALL_BOTS) {
          return res.send([])
        }

        const includeBuiltin = req.query.includeBuiltin === 'true'

        res.send(await editor.forBot(req.params.botId).getAllFiles(req.permissions, includeBuiltin))
      })
    )

    router.post(
      '/save',
      loadPermsMw,
      validateFilePayloadMw('write'),
      this.asyncMiddleware(async (req: any, res) => {
        await editor.forBot(req.params.botId).saveFile(req.body)
        res.sendStatus(200)
      })
    )

    router.post(
      '/readFile',
      loadPermsMw,
      validateFilePayloadMw('read'),
      this.asyncMiddleware(async (req: any, res) => {
        const fileContent = await editor.forBot(req.params.botId).readFileContent(req.body)

        res.send({ fileContent })
      })
    )

    router.post(
      '/download',
      loadPermsMw,
      validateFilePayloadMw('read'),
      this.asyncMiddleware(async (req: any, res, next) => {
        const buffer = await editor.forBot(req.params.botId).readFileBuffer(req.body)

        res.setHeader('Content-Disposition', `attachment; filename=${req.body.name}`)
        res.setHeader('Content-Type', 'application/octet-stream')
        res.send(buffer)
      })
    )

    router.post(
      '/exists',
      loadPermsMw,
      validateFilePayloadMw('write'),
      this.asyncMiddleware(async (req: any, res, next) => {
        res.send(await editor.forBot(req.params.botId).fileExists(req.body))
      })
    )

    router.post(
      '/rename',
      loadPermsMw,
      validateFilePayloadMw('write'),
      this.asyncMiddleware(async (req: any, res) => {
        await editor.forBot(req.params.botId).renameFile(req.body.file, req.body.newName)
        res.sendStatus(200)
      })
    )

    router.post(
      '/remove',
      loadPermsMw,
      validateFilePayloadMw('write'),
      this.asyncMiddleware(async (req: any, res, next) => {
        await editor.forBot(req.params.botId).deleteFile(req.body)
        res.sendStatus(200)
      })
    )

    router.post(
      '/upload',
      loadPermsMw,
      validateFileUploadMw,
      multer().single('file'),
      this.asyncMiddleware(async (req: any, res) => {
        const folder = path.dirname(req.body.location)
        const filename = path.basename(req.body.location)

        await this.bpfs.forBot(req.params.botId).upsertFile(folder, filename, req.file.buffer)
        res.sendStatus(200)
      })
    )

    router.get(
      '/permissions',
      loadPermsMw,
      this.asyncMiddleware(async (req: any, res) => {
        res.send(req.permissions)
      })
    )

    router.get(
      '/typings',
      this.asyncMiddleware(async (req, res) => {
        res.send(await editor.forBot(req.params.botId).loadTypings())
      })
    )
  }
}
