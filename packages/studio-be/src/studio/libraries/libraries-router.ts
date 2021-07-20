import axios from 'axios'
import * as sdk from 'botpress/sdk'
import { asyncMiddleware as asyncMw, BPRequest } from 'common/http'
import { Response } from 'express'
import fse from 'fs-extra'
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
      this.asyncMiddleware(async (req: any, res: any) => {
        if (!(await this.libService.isInitialized(req.params.botId))) {
          return []
        }

        const { dependencies } = await this.bpfs.forBot(req.params.botId).readFileAsObject('libraries', 'package.json')
        // const { dependencies } = await fse.readJson(packageJsonPath)

        res.send(dependencies)
      })
    )

    router.post(
      '/package',
      this.asyncMiddleware(async (req: any, res: any) => {
        // const { name, version } = validateNameVersion(req.body)
        // const archive = await packageLibrary(name, version!)
        // res.writeHead(200, {
        //   'Content-Type': 'application/tar+gzip',
        //   'Content-Disposition': 'attachment; filename=archive.tgz',
        //   'Content-Length': archive?.length
        // })
        // res.end(archive)
      })
    )

    router.post(
      '/executeNpm',
      this.asyncMiddleware(async (req: any, res: any) => {
        const { botId } = req.params

        const { command } = req.body
        const result = await this.libService.executeNpm(command.split(' '))
        this.logger.forBot(req.params.botId).info(`Executing NPM command ${command} \n ${result}`)

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
      '/add',
      this.asyncMiddleware(async (req: any, res: any) => {
        const { botId } = req.params
        const { name, version } = validateNameVersion(req.body)
        const { uploaded } = req.body

        if (uploaded) {
          // Since we rely on the code-editor for uploading the archive, the file needs to be copied on the file system before installing
          await this.libService.copyFileLocally(botId, path.basename(uploaded))
        }

        const result = await this.libService.executeNpm(botId, ['install', !version ? name : `${name}@${version}`])
        this.logger.forBot(req.params.botId).info(`Installing library ${name}\n ${result}`)

        if (result.indexOf('ERR!') === -1) {
          await this.libService.publishPackageChanges(botId)

          res.sendStatus(200)
        } else {
          res.sendStatus(400)
        }
      })
    )

    router.post(
      '/delete',
      this.asyncMiddleware(async (req: BPRequest, res: Response) => {
        const { botId } = req.params
        const { name } = validateNameVersion(req.body)

        if (!(await this.libService.removeLibrary(name, this.logger, this.bpfs))) {
          return res.sendStatus(400)
        }

        const result = await this.libService.executeNpm(botId)
        this.logger.forBot(req.params.botId).info(`Removing library ${name}\n ${result}`)

        res.sendStatus(200)
      })
    )
  }
}
