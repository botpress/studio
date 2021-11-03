import { decodeFolderPath, UnexpectedError } from 'common/http'
import { FlowView } from 'common/typings'
import { MutexError } from 'core/dialog'
import _ from 'lodash'
import { StudioServices } from 'studio/studio-router'
import { CustomStudioRouter } from 'studio/utils/custom-studio-router'
import yn from 'yn'

const parseFlowNameMiddleware = (req, _, next) => {
  const { flowName } = req.params
  if (flowName) {
    req.params.flowName = decodeFolderPath(flowName)
  }
  next()
}

export class FlowsRouter extends CustomStudioRouter {
  constructor(services: StudioServices) {
    super('Flows', services)
  }

  setupRoutes() {
    const router = this.router

    router.get(
      '/',
      this.asyncMiddleware(async (req, res) => {
        const botId = req.params.botId
        const flows = await this.flowService.forBot(botId).loadAll()
        res.send(flows)
      })
    )

    router.post(
      '/',
      this.asyncMiddleware(async (req, res) => {
        const { botId } = req.params
        const flow = <FlowView>req.body.flow

        await this.flowService.forBot(botId).insertFlow(flow)

        res.sendStatus(200)
      })
    )

    this.router.post(
      '/skill/:skillId/generateFlow',
      this.asyncMiddleware(async (req, res) => {
        const flowGenerator = this.skillService.getFlowGenerator(req.params.moduleName, req.params.skillId)
        if (!flowGenerator) {
          return res.status(404).send('Invalid module name or flow name')
        }

        try {
          const metadata: any = { botId: req.query.botId }
          res.send(this.skillService.finalizeFlow(await flowGenerator(req.body, metadata)))
        } catch (err) {
          throw new UnexpectedError('Could not generate flow', err)
        }
      })
    )

    this.router.post(
      '/:flowName',
      parseFlowNameMiddleware,
      this.asyncMiddleware(async (req, res) => {
        const { botId, flowName } = req.params
        const flow = <FlowView>req.body.flow

        if (_.has(flow, 'name') && flowName !== flow.name) {
          await this.flowService.forBot(botId).renameFlow(flowName, flow.name)
          return res.sendStatus(200)
        }

        try {
          await this.flowService.forBot(botId).updateFlow(flow)
          res.sendStatus(200)
        } catch (err) {
          if (err.type && err.type === MutexError.name) {
            return res.sendStatus(423) // Mutex locked
          }

          throw new UnexpectedError('Error saving flow', err)
        }
      })
    )

    this.router.post(
      '/:flowName/delete',
      parseFlowNameMiddleware,
      this.asyncMiddleware(async (req, res) => {
        const { botId, flowName } = req.params

        await this.flowService.forBot(botId).deleteFlow(flowName as string)

        res.sendStatus(200)
      })
    )
  }
}
