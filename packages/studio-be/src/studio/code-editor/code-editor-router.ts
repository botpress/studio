import { RequestWithPerms } from 'common/code-editor'
import { ALL_BOTS } from 'common/utils'
import { hasPermissions } from 'core/security'
import _ from 'lodash'
import { StudioServices } from 'studio/studio-router'
import { CustomStudioRouter } from 'studio/utils/custom-studio-router'

import { Editor } from './editor'
import { getPermissionsMw, validateFilePayloadMw } from './utils_router'

const debugRead = DEBUG('audit:code-editor:read')
const debugWrite = DEBUG('audit:code-editor:write')

export class CodeEditorRouter extends CustomStudioRouter {
  constructor(services: StudioServices) {
    super('CodeEditor', services)
    this.setupRoutes()
  }

  setupRoutes() {
    const router = this.router
    const hasPermission = hasPermissions(this.workspaceService)
    const loadPermsMw = getPermissionsMw(hasPermission)

    const editor = new Editor(this.bpfs, this.logger)

    const audit = (debugMethod: Function, label: string, req: RequestWithPerms, args?: any) => {
      debugMethod(
        `${label} %o`,
        _.merge(
          {
            ip: req.ip,
            user: _.pick(req.tokenUser, ['email', 'strategy', 'isSuperAdmin']),
            file: {
              ..._.pick(req.body.file || req.body, ['location', 'botId', 'type', 'hookType']),
              size: (req.body.file || req.body)?.content?.length
            }
          },
          args
        )
      )
    }

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
        audit(debugWrite, 'saveFile', req)

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

        audit(debugRead, 'readFile', req, { file: { size: fileContent?.length } })

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
        audit(debugWrite, 'renameFile', req, { newName: req.body.newName })

        await editor.forBot(req.params.botId).renameFile(req.body.file, req.body.newName)
        res.sendStatus(200)
      })
    )

    router.post(
      '/remove',
      loadPermsMw,
      validateFilePayloadMw('write'),
      this.asyncMiddleware(async (req: any, res, next) => {
        audit(debugWrite, 'deleteFile', req)

        await editor.forBot(req.params.botId).deleteFile(req.body)
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