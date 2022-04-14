import axios from 'axios'
import { CloudConfig } from 'botpress/sdk'
import { ResponseError, UnexpectedError } from 'common/http'
import { BadRequestError, NotFoundError, ServiceUnavailableError, UnauthorizedError } from 'core/routers'
import FormData from 'form-data'
import _ from 'lodash'
import qs from 'querystring'
import { StudioServices } from 'studio/studio-router'
import { CustomStudioRouter } from 'studio/utils/custom-studio-router'

const MAX_BODY_CLOUD_BOT_SIZE = 100 * 1024 * 1024 // 100 MB

type RuntimeStatus =
  | 'ACTIVE'
  | 'DELETED'
  | 'BLOCKED'
  | 'UPDATING'
  | 'DELETING'
  | 'BLOCKING'
  | 'PENDING'
  | 'STARTING'
  | 'FAILED'
interface Introspect {
  userId: string
  runtimeName: string
  runtimeStatus: RuntimeStatus
  botName: string
  botId: string
}

export class CloudRouter extends CustomStudioRouter {
  constructor(services: StudioServices) {
    super('Cloud', services)
  }

  private getCloudAxiosConfig(bearerToken: string) {
    return { headers: { Authorization: bearerToken } }
  }

  private async getBearerToken(cloud: CloudConfig) {
    const { clientId, clientSecret } = cloud

    try {
      const { data } = await axios.post(
        process.CLOUD_OAUTH_ENDPOINT,
        qs.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'client_credentials',
          scope: 'nlu'
        })
      )

      if (!data.access_token) {
        throw new UnauthorizedError('Cloud keys are invalid')
      }

      return `Bearer ${data?.access_token}`
    } catch (err) {
      const message = `Error fetching cloud bearer token using cloud config. clientId: ${clientId}, clientSecret: ${
        clientSecret === undefined ? clientSecret : clientSecret.replace(/./g, '*')
      }}`
      this.logger.attachError(err).error(message)
      throw new UnexpectedError(message)
    }
  }

  private async getIntrospect(bearerToken: string): Promise<Introspect> {
    try {
      const { data: introspectData } = await axios.get(
        `${process.CLOUD_CONTROLLER_ENDPOINT}/v1/introspect`,
        this.getCloudAxiosConfig(bearerToken)
      )
      if (!introspectData.botId) {
        throw new NotFoundError("Cloud chatbot doesn't exist")
      }

      return introspectData as Introspect
    } catch (err) {
      const message = 'Error fetching data from the cloud introspect endpoint'
      this.logger.attachError(err).error(message)
      throw new UnexpectedError(message)
    }
  }

  private async getCloudBotInfo(cloudBotId: string, bearerToken: string): Promise<string> {
    try {
      const { data } = await axios.get(
        `${process.CLOUD_CONTROLLER_ENDPOINT}/v1/bots/${cloudBotId}`,
        this.getCloudAxiosConfig(bearerToken)
      )

      return data
    } catch (err) {
      const defaultMessage = `Error fetching cloud bot info. Cloud bot id ${cloudBotId}`
      this.logger.attachError(err).error(defaultMessage)

      if (err.isAxiosError && err.response) {
        const { status, data } = err.response
        throw new ResponseError(data, status)
      } else {
        throw new UnexpectedError(defaultMessage)
      }
    }
  }

  private async getCloudBotOauthConfig(botId: string): Promise<CloudConfig> {
    const { cloud } = (await this.botService.findBotById(botId)) || {}
    if (!cloud || _.isEmpty(cloud)) {
      throw new BadRequestError('Cannot fetch cloud info of a non cloud chatbot')
    }

    return cloud
  }

  private async makeBotUploadPayload(botId: string, cloudBotMeta: Introspect): Promise<FormData> {
    await this.nluService.downloadAndSaveModelWeights(botId)

    const botBlob = await this.botService.exportBot(botId, { cloud: true })

    const botMultipart = new FormData()
    botMultipart.append('botId', cloudBotMeta.botId)
    botMultipart.append('botName', cloudBotMeta.botName)
    botMultipart.append('botArchive', botBlob, 'bot.tgz')
    botMultipart.append('runtimeName', cloudBotMeta.runtimeName)
    botMultipart.append('botFileName', `bot_${botId}_${Date.now()}.tgz`)

    return botMultipart
  }

  private async deployBotToCloud(bearerToken: string, botMultipart: FormData): Promise<void> {
    const axiosConfig = _.merge(this.getCloudAxiosConfig(bearerToken), {
      headers: { 'Content-Type': `multipart/form-data; boundary=${botMultipart.getBoundary()}` }
    })

    try {
      await axios.post(`${process.CLOUD_CONTROLLER_ENDPOINT}/v1/bots/upload`, botMultipart, axiosConfig)
    } catch (err) {
      const defaultMessage = 'Error deploying bot to Botpress Cloud'
      this.logger.attachError(err).error(defaultMessage)

      if (err.isAxiosError && err.response) {
        const { status, data } = err.response
        const message = _.isPlainObject(data) ? data.message : data
        throw new ResponseError(message, status)
      } else {
        throw new UnexpectedError(defaultMessage)
      }
    }
  }

  setupRoutes() {
    this.router.get(
      '/info',
      this.asyncMiddleware(async (req, res) => {
        const botId = req.params.botId
        const { cloud } = (await this.botService.findBotById(botId)) || {}
        if (!cloud || _.isEmpty(cloud)) {
          throw new BadRequestError('Cannot fetch cloud info of a non cloud chatbot')
        }

        const bearerToken = await this.getBearerToken(cloud)
        const introspect = await this.getIntrospect(bearerToken)
        const cloudBotInfo = await this.getCloudBotInfo(introspect.botId, bearerToken)

        res.send(cloudBotInfo)
      })
    )

    this.router.get(
      '/deploy',
      this.asyncMiddleware(async (req, res) => {
        const botId = req.params.botId

        const cloud = await this.getCloudBotOauthConfig(botId)
        const bearerToken = await this.getBearerToken(cloud)
        const cloudBotMeta = await this.getIntrospect(bearerToken)
        if (cloudBotMeta.runtimeStatus !== 'ACTIVE') {
          const message = `Cloud runtime ${cloudBotMeta.runtimeName} for cloud bot: ${cloudBotMeta.botId}, ${cloudBotMeta.botName} isn't ready.`
          this.logger.error(message, cloudBotMeta)
          throw new ServiceUnavailableError(message)
        }

        const multipart = await this.makeBotUploadPayload(botId, cloudBotMeta)
        if (Buffer.byteLength(multipart.getBuffer()) > MAX_BODY_CLOUD_BOT_SIZE) {
          throw new BadRequestError('Bot is too large to be uploaded on Botpress cloud')
        }

        await this.deployBotToCloud(bearerToken, multipart)

        res.end()
      })
    )
  }
}
