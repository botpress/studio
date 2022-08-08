import axios, { AxiosInstance } from 'axios'
import { Logger } from 'botpress/sdk'
import { isCDMError } from 'common/errors'
import FormData from 'form-data'
import { constants } from 'http2'

import _ from 'lodash'
import { Result, ok, err } from 'neverthrow'
import qs from 'qs'
import VError from 'verror'
import { Bot, Introspect, OAuthAccessToken, PersonalAccessToken, Principals } from './types'

export const MAX_BODY_CLOUD_BOT_SIZE = 100 * 1024 * 1024 // 100 MB

type ErrorCodes = 'cdm_conflict_error' | 'unexpected_error'
type Modify<T, R> = Omit<T, keyof R> & R

class CloudClientError extends VError {
  public name: ErrorCodes
  constructor(options: Modify<VError.Options, { name: ErrorCodes }>, message: string, ...params: any[]) {
    super(options, message, ...params)

    this.name = options.name
  }
}

export class CloudClient {
  private cdmAxios: AxiosInstance
  private oauthAxios: AxiosInstance

  constructor(private logger: Logger) {
    this.cdmAxios = axios.create({ baseURL: `${process.CLOUD_CONTROLLER_ENDPOINT}/v1` })
    this.oauthAxios = axios.create({ baseURL: process.CLOUD_OAUTH_ENDPOINT })
  }

  public async createBot(props: {
    personalAccessToken: string
    name: string
    workspaceId: string
  }): Promise<Result<Bot, CloudClientError>> {
    const { personalAccessToken, name, workspaceId } = props
    try {
      const { data } = await this.cdmAxios.post(
        '/bots',
        { workspaceId, name },
        this.getCloudAxiosConfig({ token: personalAccessToken, principals: {} })
      )
      return ok(data)
    } catch (e) {
      if (isCDMError(e)) {
        if (e.response.status === constants.HTTP_STATUS_CONFLICT) {
          return err(new CloudClientError({ name: 'cdm_conflict_error', cause: e }, e.response.data.message))
        }
      }
      return err(new CloudClientError({ name: 'unexpected_error', cause: e }, 'Error while creating bot'))
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

    await this.cdmAxios.post('/bots/upload', botMultipart, axiosConfig)
  }

  public async listBots(props: { personalAccessToken: PersonalAccessToken; workspaceId: string }): Promise<Bot[]> {
    const { personalAccessToken, workspaceId } = props
    const { data } = await this.cdmAxios.get(
      `/bots/workspaces/${workspaceId}`,
      this.getCloudAxiosConfig({ token: personalAccessToken, principals: {} })
    )
    return data
  }

  public async getIntrospect(props: { oauthAccessToken: OAuthAccessToken; clientId: string }): Promise<Introspect> {
    const { oauthAccessToken, clientId } = props
    const { data: introspectData } = await this.cdmAxios.get(
      '/introspect',
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
      const { data } = await this.oauthAxios.post(
        '/',
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
