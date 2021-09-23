import axios from 'axios'
import path from 'path'
import { StudioServices } from 'studio/studio-router'
import { CustomStudioRouter } from 'studio/utils/custom-studio-router'
import { LibrariesService } from './libraries-service'
import { validateNameVersion } from './utils'

export class LibrariesRouter extends CustomStudioRouter {
  private libService: LibrariesService

  constructor(services: StudioServices) {
    super('Libraries', services)
    this.libService = new LibrariesService(this.logger, this.bpfs)
  }

  setupRoutes() {
    const router = this.router
    router.get(
      '/list',
      this.needPermissions('read', 'module.code-editor'),
      this.asyncMiddleware(async (req: any, res: any) => {
        if (!(await this.libService.isInitialized(req.params.botId))) {
          return []
        }

        const { dependencies } = await this.bpfs.forBot(req.params.botId).readFileAsObject('libraries', 'package.json')

        res.send(dependencies)
      })
    )

    router.post(
      '/executeNpm',
      this.needPermissions('read', 'module.code-editor'),
      this.asyncMiddleware(async (req: any, res: any) => {
        const { botId } = req.params
        const { command } = req.body

        this.logger.forBot(req.params.botId).info(`Executing NPM command ${command}...`)
        await this.libService.executeNpm(botId, command.split(' '))

        res.sendStatus(200)
      })
    )

    router.get(
      '/search/:name',
      this.asyncMiddleware(async (req: any, res: any) => {
        const { data } = await axios.get(`https://www.npmjs.com/search/suggestions?q=${req.params.name}`)
        res.send(data)
      })
    )

    router.get(
      '/details/:name',
      this.asyncMiddleware(async (req: any, res: any) => {
        const { data } = await axios.get(`https://registry.npmjs.org/${req.params.name}`, {
          headers: {
            accept: 'application/vnd.npm.install-v1+json'
          }
        })

        res.send(data)
      })
    )

    router.post(
      '/sync',
      this.needPermissions('read', 'module.code-editor'),
      this.asyncMiddleware(async (req: any, res: any) => {
        const { botId } = req.params

        this.logger.forBot(req.params.botId).info('Syncing libraries...')

        await this.libService.executeNpm(botId)

        res.sendStatus(200)
      })
    )

    router.post(
      '/add',
      this.needPermissions('read', 'module.code-editor'),
      this.asyncMiddleware(async (req: any, res: any) => {
        const { botId } = req.params
        const { name, version } = validateNameVersion(req.body)
        const { uploaded } = req.body

        if (uploaded) {
          // Since we rely on the code-editor for uploading the archive, the file needs to be copied on the file system before installing
          await this.libService.copyFileLocally(botId, path.basename(uploaded))
        }

        this.logger.forBot(req.params.botId).info(`Installing library ${name}...`)
        await this.libService.executeNpm(botId, ['install', !version ? name : `${name}@${version}`])

        res.sendStatus(200)
      })
    )

    router.post(
      '/delete',
      this.needPermissions('read', 'module.code-editor'),
      this.asyncMiddleware(async (req, res) => {
        const { botId } = req.params
        const { name } = validateNameVersion(req.body)

        this.logger.forBot(req.params.botId).info(`Removing library ${name}...`)

        if (!(await this.libService.removeLibrary(botId, name))) {
          return res.sendStatus(400)
        }

        res.sendStatus(200)
      })
    )
  }
}
