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

  setupRoutes() {
    this.router.get(
      '/deploy',
      // this.needPermissions('read', 'bot.content'), // if you can read content you can get suggestions
      this.asyncMiddleware(async (req, res) => {
        const botId = req.params.botId
        const { cloud } = (await this.botService.findBotById(botId)) || {}
        if (!cloud) {
          return
        }
        const { oauthUrl, clientId, clientSecret } = cloud

        console.log('testing here! ')
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
          .get('https://controllerapi.botpress.dev/v1/introspect', {
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

        const testRes = await axios
          .post('https://controllerapi.botpress.dev/v1/bots/upload', botMultipart, {
            headers: {
              'Content-Type': `multipart/form-data; boundary=${botMultipart.getBoundary()}`,
              Authorization: bearerToken
            }
          })
          .then((res) => {
            console.log(res.status)
            return res.data
          })
          .catch((e) => {
            console.log(e)
            console.log(e.response.data)
          })
        res.send({ deployed: true })
      })
    )
  }
}
