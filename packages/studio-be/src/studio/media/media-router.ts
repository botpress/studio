import _ from 'lodash'

import path from 'path'
import { StudioServices } from 'studio/studio-router'
import { Instance } from 'studio/utils/bpfs'
import { CustomStudioRouter } from 'studio/utils/custom-studio-router'
import { safeId, sanitize } from 'studio/utils/file-names'
import { fileUploadMulter } from 'studio/utils/http-multer'

const DEFAULT_ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'audio/mpeg', 'video/mp4']
const DEFAULT_MAX_FILE_SIZE = '25mb'

class MediaRouter extends CustomStudioRouter {
  // TODO: botId must be provided somehow
  botId: string = 'smalltalk'
  getFileUrl(fileName: string) {
    // TODO: we need a router that returns those files (GET). I think it's part of the BP backend atm
    return `/api/v1/bots/${this.botId}/media/${encodeURIComponent(fileName)}`
  }

  constructor(services: StudioServices) {
    super('User', services)
  }

  async setupRoutes(botpressConfig) {
    // TODO: What do we do about those configs? Should they remain configurable? Are they fixed for Botpress Cloud? Are they per-bot?
    const router = this.router

    const mediaUploadMulter = fileUploadMulter(
      DEFAULT_ALLOWED_MIME_TYPES,
      DEFAULT_MAX_FILE_SIZE
      // botpressConfig.fileUpload.allowedMimeTypes ?? DEFAULT_ALLOWED_MIME_TYPES,
      // botpressConfig.fileUpload.maxFileSize ?? DEFAULT_MAX_FILE_SIZE
    )

    router.post(
      '/',
      this.checkTokenHeader,
      this.needPermissions('write', 'bot.media'),
      this.asyncMiddleware(async (req, res) => {
        mediaUploadMulter(req, res, async (err) => {
          const email = req.tokenUser!.email
          if (err) {
            return res.status(400).send(err.message)
          }

          const file = req['file']
          const fileName = sanitize(`${safeId(20)}-${path.basename(file.originalname)}`)

          await Instance.upsertFile(path.resolve('media', fileName), file.buffer)

          res.json({ url: this.getFileUrl(fileName) })
        })
      })
    )
  }
}

export default MediaRouter
