import axios, { AxiosInstance } from 'axios'
import { isCDMError } from 'common/errors'
import FormData from 'form-data'

import _ from 'lodash'
import { Result, ok, err } from 'neverthrow'
import VError from 'verror'
import { Bot, Introspect, OAuthAccessToken, PersonalAccessToken, Principals } from '../studio/cloud/types'

export const MAX_BODY_CLOUD_BOT_SIZE = 100 * 1024 * 1024 // 100 MB

type ErrorCodes = 'cdm_conflict_error' | 'unexpected_error'
type Modify<T, R> = Omit<T, keyof R> & R

type Token = PersonalAccessToken | OAuthAccessToken

export interface CDMWorkspace {
  id: string
  name: string
}

class CloudClientError extends VError {
  public name: ErrorCodes
  constructor(options: Modify<VError.Options, { name: ErrorCodes }>, message: string, ...params: any[]) {
    super(options, message, ...params)

    this.name = options.name
  }
}

export class CloudClient {
  private axios: AxiosInstance

  constructor(props: { cloudControllerEndpoint: string }) {
    const { cloudControllerEndpoint } = props
    this.axios = axios.create({ baseURL: `${cloudControllerEndpoint}/v1` })
  }

  public async listWorkspaces(props: {
    personalAccessToken: PersonalAccessToken
    signal: AbortSignal
  }): Promise<CDMWorkspace[]> {
    const { personalAccessToken, signal } = props

    const config = this.getCloudAxiosConfig({ token: personalAccessToken, principals: {} })
    const { data: workspaces } = await this.axios.get('/workspaces', {
      ...config,
      signal
    })

    return workspaces as CDMWorkspace[]
  }

  public async createBot(props: {
    personalAccessToken: string
    name: string
    workspaceId: string
  }): Promise<Result<Bot, CloudClientError>> {
    const { personalAccessToken, name, workspaceId } = props
    try {
      const { data } = await this.axios.post(
        '/bots',
        { workspaceId, name },
        this.getCloudAxiosConfig({ token: personalAccessToken, principals: {} })
      )
      return ok(data)
    } catch (e) {
      if (isCDMError(e)) {
        if (e.response.status === 409) {
          return err(new CloudClientError({ name: 'cdm_conflict_error', cause: e }, e.response.data.message))
        }
      }
      return err(new CloudClientError({ name: 'unexpected_error', cause: e }, 'Error while creating bot'))
    }
  }

  public async uploadBot(props: { token: Token; botId: string; botMultipart: FormData }): Promise<void> {
    const { token, botId, botMultipart } = props

    const axiosConfig = _.merge(this.getCloudAxiosConfig({ token, principals: { botId } }), {
      maxContentLength: MAX_BODY_CLOUD_BOT_SIZE,
      maxBodyLength: MAX_BODY_CLOUD_BOT_SIZE,
      headers: { 'Content-Type': `multipart/form-data; boundary=${botMultipart.getBoundary()}` }
    })

    await this.axios.post('/bots/upload', botMultipart, axiosConfig)
  }

  public async listBots(props: { personalAccessToken: PersonalAccessToken; workspaceId: string }): Promise<Bot[]> {
    const { personalAccessToken, workspaceId } = props
    const { data } = await this.axios.get(
      `/bots/workspaces/${workspaceId}`,
      this.getCloudAxiosConfig({ token: personalAccessToken, principals: {} })
    )
    return data
  }

  public async getIntrospect(props: { oauthAccessToken: OAuthAccessToken; clientId: string }): Promise<Introspect> {
    const { oauthAccessToken, clientId } = props
    const { data: introspectData } = await this.axios.get(
      '/introspect',
      this.getCloudAxiosConfig({ token: oauthAccessToken, principals: { clientId } })
    )
    if (!introspectData.botId) {
      throw new VError("Cloud chatbot doesn't exist")
    }

    return introspectData as Introspect
  }

  private getCloudAxiosConfig(props: { token: Token; principals: Principals }) {
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
