import axios from 'axios'
import { Logger } from 'botpress/sdk'
import { isCDMError } from 'common/errors'
import FormData from 'form-data'
import { constants } from 'http2'

import _ from 'lodash'
import { Result, ok, err, ResultAsync, okAsync } from 'neverthrow'
import qs from 'qs'
import { VError } from 'verror'
import { CDMConflictError, UnexpectedError } from './errors'
import { Bot, Introspect, OAuthAccessToken, PersonalAccessToken, Principals } from './types'

export const MAX_BODY_CLOUD_BOT_SIZE = 100 * 1024 * 1024 // 100 MB

export class CloudClient {
  constructor(private logger: Logger) {}

  public async createBot(props: {
    personalAccessToken: string
    name: string
    workspaceId: string
  }): Promise<Result<Bot, CDMConflictError | UnexpectedError>> {
    const { personalAccessToken, name, workspaceId } = props
    try {
      const { data } = await axios.post(
        `${process.CLOUD_CONTROLLER_ENDPOINT}/v1/bots`,
        { workspaceId, name },
        this.getCloudAxiosConfig({ token: personalAccessToken, principals: {} })
      )
      return ok(data)
    } catch (e) {
      if (isCDMError(e)) {
        if (e.response.status === constants.HTTP_STATUS_CONFLICT) {
          const { message } = e.response.data
          return err(new CDMConflictError(message))
        }
      }
      return err(new UnexpectedError(e, 'Error while attempting to create bot'))
    }
  }

  public async uploadBot(props: {
    personalAccessToken: PersonalAccessToken
    botId: string
    botMultipart: FormData
  }): Promise<void> {
    const { personalAccessToken, botId, botMultipart } = props
    const axiosConfig = _.merge(this.getCloudAxiosConfig({ token: personalAccessToken, principals: { botId } }), {
      maxContentLength: MAX_BODY_CLOUD_BOT_SIZE,
      maxBodyLength: MAX_BODY_CLOUD_BOT_SIZE,
      headers: { 'Content-Type': `multipart/form-data; boundary=${botMultipart.getBoundary()}` }
    })

    await axios.post(`${process.CLOUD_CONTROLLER_ENDPOINT}/v1/bots/upload`, botMultipart, axiosConfig)
  }

  public async listBots(props: { personalAccessToken: PersonalAccessToken; workspaceId: string }): Promise<Bot[]> {
    const { personalAccessToken, workspaceId } = props
    const { data } = await axios.get(
      `${process.CLOUD_CONTROLLER_ENDPOINT}/v1/bots/workspaces/${workspaceId}`,
      this.getCloudAxiosConfig({ token: personalAccessToken, principals: {} })
    )
    return data
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
      const message = `Error fetching cloud access token using cloud config. clientId: ${clientId}, clientSecret: ${
        clientSecret === undefined ? clientSecret : clientSecret.replace(/./g, '*')
      }}`
      this.logger.attachError(err).error(message)
      return
    }
  }

  private getCloudAxiosConfig(props: { token: PersonalAccessToken | OAuthAccessToken; principals: Principals }) {
    const { token, principals } = props
    const headers = { Authorization: `bearer ${token}` }
    if (principals.botId) {
      headers['x-bot-id'] = principals.botId
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
