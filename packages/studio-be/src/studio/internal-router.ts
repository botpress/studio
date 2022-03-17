import { UnauthorizedError } from 'common/http'
import _ from 'lodash'
import { StudioServices } from 'studio/studio-router'
import { CustomStudioRouter } from 'studio/utils/custom-studio-router'

import { getDebugScopes, setDebugScopes } from '../debug'

export class InternalRouter extends CustomStudioRouter {
  constructor(services: StudioServices) {
    super('Internal', services)
  }

  setupRoutes() {
    if (!process.env.INTERNAL_PASSWORD) {
      return
    }

    const router = this.router
    router.use((req, res, next) => {
      if (req.headers.authorization !== process.env.INTERNAL_PASSWORD) {
        return next(new UnauthorizedError('Invalid password'))
      }

      next()
    })

    router.get(
      '/getDebugScopes',
      this.asyncMiddleware(async (req, res) => {
        res.send(getDebugScopes())
      })
    )

    router.post(
      '/setDebugScopes',
      this.asyncMiddleware(async (req, res) => {
        setDebugScopes(req.body.scopes)
        res.sendStatus(200)
      })
    )

    router.post(
      '/updateTokenVersion',
      this.asyncMiddleware(async (req, res) => {
        const { email, strategy, tokenVersion } = req.body
        await this.authService.tokenVersionChange(email, strategy, tokenVersion)

        res.sendStatus(200)
      })
    )

    router.post(
      '/invalidateFile',
      this.asyncMiddleware(async (req, res) => {
        let { key } = req.body

        if (process.BPFS_STORAGE === 'disk') {
          key = key.replace('::data/', '::')
        }

        await this.objectCache.invalidate(key, true)

        res.sendStatus(200)
      })
    )

    router.post(
      '/setBotMountStatus',
      this.asyncMiddleware(async (req, res) => {
        const { botId, isMounted } = req.body
        isMounted ? await this.botService.localMount(botId) : await this.botService.localUnmount(botId)

        res.sendStatus(200)
      })
    )

    router.post(
      '/checkBotMigrations',
      this.asyncMiddleware(async (req, res) => {
        const { botId } = req.body
        await this.botService.migrateBotContent(botId)

        res.sendStatus(200)
      })
    )

    router.post(
      '/invalidateCmsForBot',
      this.asyncMiddleware(async (req, res) => {
        const { botId } = req.body

        // Invalidations are sent via redis when cluster is on
        if (!process.CLUSTER_ENABLED) {
          await this.cmsService.broadcastInvalidateForBot(botId)
        }

        res.sendStatus(200)
      })
    )
  }
}
