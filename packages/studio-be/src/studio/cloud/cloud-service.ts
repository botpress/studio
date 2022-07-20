import { CloudConfig } from 'botpress/sdk'
import { TokenUser } from 'common/typings'
import { BotService } from 'core/bots'
import { AuthService } from 'core/security'
import { backOff } from 'exponential-backoff'
import FormData from 'form-data'
import _ from 'lodash'
import { NLUService } from 'studio/nlu'
import { VError } from 'verror'
import { CloudClient, MAX_BODY_CLOUD_BOT_SIZE } from './cloud-client'
import { NAMES } from './errors'

export class CloudService {
  constructor(
    private cloudClient: CloudClient,
    private authService: AuthService,
    private botService: BotService,
    private nluService: NLUService
  ) { }

  public async deployBot(props: { botId: string; workspaceId: string; tokenUser: TokenUser }) {
    const { tokenUser, workspaceId, botId } = props

    const authUser = await this.authService.findUser(tokenUser)
    if (!authUser) {
      throw new VError({ name: NAMES.cannot_find_user }, 'Could not find user')
    }

    const personalAccessToken = authUser.attributes['personal_access_token']
    if (_.isNil(personalAccessToken)) {
      throw new VError({ name: NAMES.no_personal_access_token }, 'No personal access token')
    }

    if (!_.isString(personalAccessToken)) {
      throw new VError('personalAccessToken must be a string')
    }

    const botConfig = await this.botService.findBotById(botId)
    if (!botConfig) {
      throw new VError({ name: NAMES.no_bot_config }, `no bot config for bot ${botId}`)
    }

    const { cloud } = botConfig
    let cloudBotId: string
    let clientId: string
    let clientSecret: string
    if (!cloud) {
      const cloudBot = await this.cloudClient.createBot({
        personalAccessToken,
        name: botId,
        workspaceId
      })
      cloudBotId = cloudBot.id
      clientId = cloudBot.apiKey.id
      clientSecret = cloudBot.apiKey.secret
      await this.botService.updateBot(botId, {
        cloud: { botId: cloudBotId, clientId: cloudBot.apiKey.id, clientSecret: cloudBot.apiKey.secret }
      })
    } else {
      cloudBotId = cloud.botId
      clientId = cloud.clientId
      clientSecret = cloud.clientSecret
    }

    const botMultipart = await this.makeBotUploadPayload({ botId })
    if (Buffer.byteLength(botMultipart.getBuffer()) > MAX_BODY_CLOUD_BOT_SIZE) {
      throw new VError({ name: NAMES.too_large_message }, 'Chatbot is too large to be uploaded on Botpress cloud')
    }

    await this.waitUntilBotUploadable({ cloudBotId, clientId, clientSecret })
    await this.cloudClient.uploadBot({ botMultipart, cloudBotId, personalAccessToken })
  }

  private async waitUntilBotUploadable(props: {
    cloudBotId: string
    clientId: CloudConfig['clientId']
    clientSecret: CloudConfig['clientSecret']
  }): Promise<void> {
    const { cloudBotId, clientId, clientSecret } = props

    const oauthAccessToken = await this.cloudClient.getAccessToken({ clientId, clientSecret })
    if (!oauthAccessToken) {
      throw new VError('no oauthAccessToken')
    }

    const isRuntimeReady = async () => {
      const { runtimeStatus } = await this.cloudClient.getIntrospect({ oauthAccessToken, clientId })
      if (runtimeStatus !== 'ACTIVE') {
        throw new VError(`runtime for bot ${cloudBotId} is ${runtimeStatus}`)
      }
    }

    return backOff(() => isRuntimeReady(), {
      numOfAttempts: 10,
      jitter: 'full',
      delayFirstAttempt: true,
      startingDelay: 100,
      maxDelay: 10_000
    })
  }

  private async makeBotUploadPayload(props: { botId: string }): Promise<FormData> {
    const { botId } = props
    await this.nluService.downloadAndSaveModelWeights(botId)

    const botBlob = await this.botService.exportBot(botId, { cloud: true })

    const botMultipart = new FormData()
    // botMultipart.append('botId', cloudBotMeta.botId)
    // botMultipart.append('botName', cloudBotMeta.botName)
    botMultipart.append('botArchive', botBlob, 'bot.tgz')
    // botMultipart.append('runtimeName', cloudBotMeta.runtimeName)
    // botMultipart.append('botFileName', `bot_${botId}_${Date.now()}.tgz`)

    return botMultipart
  }
}
