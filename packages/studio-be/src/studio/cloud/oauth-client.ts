import axios, { AxiosInstance } from 'axios'
import qs from 'qs'
import VError from 'verror'

export class OAuthClient {
  private axios: AxiosInstance
  constructor(props: { oauthEndpoint: string }) {
    this.axios = axios.create({ baseURL: props.oauthEndpoint })
  }

  public async getAccessToken(props: { clientId: string; clientSecret: string }): Promise<string | undefined> {
    const { clientId, clientSecret } = props

    try {
      const { data } = await this.axios.post(
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
      throw new VError(err, message)
    }
  }
}
