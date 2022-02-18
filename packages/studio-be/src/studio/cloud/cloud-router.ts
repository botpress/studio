import axios from 'axios'
import { BotConfig } from 'botpress/sdk'
import FormData from 'form-data'
import qs from 'querystring'
import { StudioServices } from 'studio/studio-router'
import { CustomStudioRouter } from 'studio/utils/custom-studio-router'

export class CloudRouter extends CustomStudioRouter {
  constructor(services: StudioServices) {
    super('Cloud', services)
  }
  // bots/botBot
  setupRoutes() {
    this.router.get(
      '/info',
      this.needPermissions('read', 'bot.content'), // if you can read content you can deploy to cloud...right?
      this.asyncMiddleware(async (req, res) => {
        const botId = req.params.botId
        const { cloud } = (await this.botService.findBotById(botId)) || {}
        if (!cloud) {
          return
        }
        const { oauthUrl, clientId, clientSecret } = cloud

        const bearerToken = await axios
          .post(
            oauthUrl,
            qs.stringify({
              client_id: clientId,
              client_secret: clientSecret,
              grant_type: 'client_credentials'
            })
          )
          .then((res) => `Bearer ${res.data?.access_token}`)

        const introspect = await axios
          .get(`${process.CONTROLLERAPI_ENDPOINT}/v1/introspect`, {
            headers: {
              Authorization: bearerToken
            }
          })
          .then((res) => res.data)

        const { status, data } = await axios
          .get(`${process.CONTROLLERAPI_ENDPOINT}/v1/bots/${introspect.botId}`, {
            headers: {
              Authorization: bearerToken
            }
          })
          .then((res) => {
            const { status, data } = res
            return { status, data }
          })
          .catch((e) => {
            const { status, data } = e
            return { status, data }
          })
        res.status(status).send(data)
      })
    )

    this.router.get(
      '/deploy',
      this.needPermissions('read', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const botId = req.params.botId
        const { cloud } = (await this.botService.findBotById(botId)) || {}
        if (!cloud) {
          return
        }
        const { oauthUrl, clientId, clientSecret } = cloud

        const bearerToken = await axios
          .post(
            oauthUrl,
            qs.stringify({
              client_id: clientId,
              client_secret: clientSecret,
              grant_type: 'client_credentials'
            })
          )
          .then((res) => `Bearer ${res.data?.access_token}`)

        const botBlob = await this.botService.exportBot(botId)
        const introspect = await axios
          .get(`${process.CONTROLLERAPI_ENDPOINT}/v1/introspect`, {
            headers: {
              Authorization: bearerToken
            }
          })
          .then((res) => res.data)

        const botMultipart = new FormData()
        botMultipart.append('botId', introspect.botId)
        botMultipart.append('runtimeName', introspect.runtimeName)
        botMultipart.append('botFileName', `bot_${botId}_${Date.now()}.tgz`)
        botMultipart.append('botArchive', botBlob, 'bot.tgz')

        const { status, data } = await axios
          .post(`${process.CONTROLLERAPI_ENDPOINT}/v1/bots/upload`, botMultipart, {
            headers: {
              'Content-Type': `multipart/form-data; boundary=${botMultipart.getBoundary()}`,
              Authorization: bearerToken
            }
          })
          .then((res) => {
            const { status, data } = res
            return { status, data }
          })
          .catch((e) => {
            const { status, data } = e
            return { status, data }
          })
        res.status(status).send(data)
      })
    )
  }
}
