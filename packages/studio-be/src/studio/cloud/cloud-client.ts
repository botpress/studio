import axios from 'axios'
import { Logger } from 'botpress/sdk'

import FormData from 'form-data'
import _ from 'lodash'
import qs from 'qs'
import { VError } from 'verror'
import { Bot, Introspect, OAuthAccessToken, PersonalAccessToken, Principals } from './types'

export const MAX_BODY_CLOUD_BOT_SIZE = 100 * 1024 * 1024 // 100 MB

export class CloudClient {
  constructor(private logger: Logger) { }

  public async createBot(props: { personalAccessToken: string; name: string; workspaceId: string }): Promise<Bot> {
    const { personalAccessToken, name, workspaceId } = props
    const { data } = await axios.post(
      `${process.CLOUD_CONTROLLER_ENDPOINT}/v1/bots`,
      { workspaceId, name },
      this.getCloudAxiosConfig({ token: personalAccessToken, principals: {} })
    )
    return data as Bot
  }

  public async canDeployBot(props: { oauthAccessToken: OAuthAccessToken; cloudBotId: string }): Promise<boolean> {
    const { oauthAccessToken, cloudBotId } = props
    try {
      await axios.get(
        `${process.CLOUD_CONTROLLER_ENDPOINT}/v1/bots/can-upload`,
        this.getCloudAxiosConfig({ token: oauthAccessToken, principals: { cloudBotId } })
      )
      return true
    } catch {
      return false
    }
  }

  public async uploadBot(props: {
    personalAccessToken: PersonalAccessToken
    cloudBotId: string
    botMultipart: FormData
  }): Promise<void> {
    const { personalAccessToken, cloudBotId, botMultipart } = props
    const axiosConfig = _.merge(this.getCloudAxiosConfig({ token: personalAccessToken, principals: { cloudBotId } }), {
      maxContentLength: MAX_BODY_CLOUD_BOT_SIZE,
      maxBodyLength: MAX_BODY_CLOUD_BOT_SIZE,
      headers: { 'Content-Type': `multipart/form-data; boundary=${botMultipart.getBoundary()}` }
    })

    await axios.post(`${process.CLOUD_CONTROLLER_ENDPOINT}/v1/bots/upload`, botMultipart, axiosConfig)
  }

  public async getIntrospect(props: { oauthAccessToken: OAuthAccessToken; clientId: string }): Promise<Introspect> {
    const { oauthAccessToken, clientId } = props
    const { data: introspectData } = await axios.get(
      `${process.CLOUD_CONTROLLER_ENDPOINT}/v1/introspect`,
      this.getCloudAxiosConfig({ token: oauthAccessToken, principals: { clientId } })
    )
    if (!introspectData.botId) {
      throw new VError("Cloud chatbot doesn't exist")
    }

    return introspectData as Introspect
  }

  public async getAccessToken(props: { clientId: string; clientSecret: string }): Promise<string | undefined> {
    const { clientId, clientSecret } = props

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

      if (!data) {
        return
      }

      if (!data.access_token) {
        return
      }

      return data.access_token
    } catch (err) {
      const message = `Error fetching cloud access token using cloud config. clientId: ${clientId}, clientSecret: ${clientSecret === undefined ? clientSecret : clientSecret.replace(/./g, '*')
        }}`
      this.logger.attachError(err).error(message)
      return
    }
  }

  private getCloudAxiosConfig(props: { token: PersonalAccessToken | OAuthAccessToken; principals: Principals }) {
    const { token, principals } = props
    const headers = { Authorization: `bearer ${token}` }
    if (principals.cloudBotId) {
      headers['x-bot-id'] = principals.cloudBotId
    }
    if (principals.userId) {
      headers['x-user-id'] = principals.userId
    }
    if (principals.clientId) {
      headers['x-subject'] = principals.clientId
    }
    return { headers }
  }
}
