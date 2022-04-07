import axios from 'axios'
import { CloudConfig } from 'botpress/sdk'
import FormData from 'form-data'
import qs from 'querystring'
import { StudioServices } from 'studio/studio-router'
import { CustomStudioRouter } from 'studio/utils/custom-studio-router'

const ACTIVE_RUNTIME_STATUS = 'ACTIVE'

export class CloudRouter extends CustomStudioRouter {
  constructor(services: StudioServices) {
    super('Cloud', services)
  }

  getBearerToken(cloud: CloudConfig) {
    const { clientId, clientSecret } = cloud

    return axios
      .post(
        process.CLOUD_OAUTH_ENDPOINT,
        qs.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'client_credentials',
          scope: 'nlu'
        })
      )
      .then((res) => `Bearer ${res.data?.access_token}`)
      .catch((err) => null)
  }

  getIntrospect(bearerToken: string) {
    return axios
      .get(`${process.CLOUD_CONTROLLER_ENDPOINT}/v1/introspect`, {
        headers: {
          Authorization: bearerToken
        }
      })
      .then((res) => res.data)
      .catch((err) => null)
  }

  setupRoutes() {
    this.router.get(
      '/info',
      this.asyncMiddleware(async (req, res) => {
        const botId = req.params.botId
        const { cloud } = (await this.botService.findBotById(botId)) || {}
        if (!cloud) {
          return
        }

        const bearerToken = await this.getBearerToken(cloud)
        if (!bearerToken) {
          return res.status(401)
        }

        const introspect = await this.getIntrospect(bearerToken)
        if (!introspect) {
          return res.status(404)
        }

        try {
          const { status, data } = await axios.get(`${process.CLOUD_CONTROLLER_ENDPOINT}/v1/bots/${introspect.botId}`, {
            headers: {
              Authorization: bearerToken,
              'x-user-id': introspect.userId,
              'x-bot-id': introspect.botId
            }
          })
          res.status(status).send(data)
        } catch (err) {
          if (err.isAxiosError) {
            const { status, data } = err.response || { status: 500, data: undefined }
            res.status(status).send(data)
          } else {
            res.status(500)
          }
        }
      })
    )

    this.router.get(
      '/deploy',
      this.asyncMiddleware(async (req, res) => {
        const botId = req.params.botId
        const { cloud } = (await this.botService.findBotById(botId)) || {}
        if (!cloud) {
          return
        }

        const bearerToken = await this.getBearerToken(cloud)
        if (!bearerToken) {
          return res.status(401)
        }

        const introspect = await this.getIntrospect(bearerToken)
        if (!introspect) {
          return res.status(404)
        }

        if (introspect.runtimeStatus !== ACTIVE_RUNTIME_STATUS) {
          res.status(503).send({ message: "We're preparing your bot resource. Please try again in a few minutes." })
          return
        }

        await this.nluService.downloadAndSaveModelWeights(botId)

        const botBlob = await this.botService.exportBot(botId, { cloud: true })

        const botMultipart = new FormData()
        botMultipart.append('botId', introspect.botId)
        botMultipart.append('botName', introspect.botName)
        botMultipart.append('botArchive', botBlob, 'bot.tgz')
        botMultipart.append('runtimeName', introspect.runtimeName)
        botMultipart.append('botFileName', `bot_${botId}_${Date.now()}.tgz`)

        try {
          const { status, data } = await axios.post(
            `${process.CLOUD_CONTROLLER_ENDPOINT}/v1/bots/upload`,
            botMultipart,
            {
              headers: {
                'Content-Type': `multipart/form-data; boundary=${botMultipart.getBoundary()}`,
                Authorization: bearerToken,
                'x-user-id': introspect.userId,
                'x-bot-id': introspect.botId
              },
              maxBodyLength: 100 * 1024 * 1024 // 100 MB
            }
          )
          res.status(status).send(data)
        } catch (err) {
          if (err.isAxiosError) {
            const { status, data } = err.response || { status: 500, data: undefined }
            res.status(status).send(data)
          } else {
            res.status(500)
          }
        }
      })
    )
  }
}
