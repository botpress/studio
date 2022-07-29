import { CloudConfig } from 'botpress/sdk'
import { UnreachableCaseError } from 'common/errors'
import { BotService } from 'core/bots'
import { backOff } from 'exponential-backoff'
import FormData from 'form-data'
import _ from 'lodash'
import { NLUService } from 'studio/nlu'
import { Result, Ok, Err } from 'ts-results'
import { VError } from 'verror'
import { CloudClient, MAX_BODY_CLOUD_BOT_SIZE } from './cloud-client'
import { CDMConflictError, UnexpectedError } from './errors'
import { Bot } from './types'

export class CloudService {
  constructor(private cloudClient: CloudClient, private botService: BotService, private nluService: NLUService) { }

  public async deployBot(props: {
    botId: string
    workspaceId: string
    personalAccessToken: string
  }): Promise<Result<void, 'message too large' | 'no bot config' | 'bot conflict'>> {
    const { personalAccessToken, workspaceId, botId } = props

    const botConfig = await this.botService.findBotById(botId)
    if (!botConfig) {
      return Err('no bot config')
    }

    const { cloud } = botConfig
    let cloudBotId: string
    let clientId: string
    let clientSecret: string

    if (!cloud) {
      let cloudBot: Bot | undefined
      const result = await this.cloudClient.createBot({
        personalAccessToken,
        name: botId,
        workspaceId
      })
      if (result.err) {
        const { val } = result

        if (val instanceof CDMConflictError) {
          return Err('bot conflict')
        }

        if (val instanceof UnexpectedError) {
          return Err('bot conflict')
        }

        throw new UnreachableCaseError(val)
      }

      if (result.ok) {
        cloudBot = result.val
        cloudBotId = cloudBot.id
        clientId = cloudBot.apiKey.id
        clientSecret = cloudBot.apiKey.secret
      } else {
        return Err('bot conflict')
      }

      await this.botService.updateBot(botId, {
        cloud: { botId: cloudBotId, clientId: cloudBot.apiKey.id, clientSecret: cloudBot.apiKey.secret, workspaceId }
      })
    } else {
      cloudBotId = cloud.botId
      clientId = cloud.clientId
      clientSecret = cloud.clientSecret
    }

    const botMultipart = await this.makeBotUploadPayload({ botId })
    if (Buffer.byteLength(botMultipart.getBuffer()) > MAX_BODY_CLOUD_BOT_SIZE) {
      return Err('message too large')
    }

    await this.waitUntilBotUploadable({ cloudBotId, clientId, clientSecret })
    await this.cloudClient.uploadBot({ botMultipart, cloudBotId, personalAccessToken })

    return Ok.EMPTY
  }

  private async waitUntilBotUploadable(props: {
    cloudBotId: string
    clientId: CloudConfig['clientId']
    clientSecret: CloudConfig['clientSecret']
  }): Promise<Result<void, 'no oauthAccessToken' | 'runtime cannot start'>> {
    const { cloudBotId, clientId, clientSecret } = props

    const oauthAccessToken = await this.cloudClient.getAccessToken({ clientId, clientSecret })
    if (!oauthAccessToken) {
      return Err('no oauthAccessToken')
    }

    const isRuntimeReady = async (): Promise<Result<void, RuntimeNotActiveError>> => {
      const { runtimeStatus } = await this.cloudClient.getIntrospect({ oauthAccessToken, clientId })
      if (runtimeStatus !== 'ACTIVE') {
        return Err(new RuntimeNotActiveError(cloudBotId, runtimeStatus))
      }

      return Ok.EMPTY
    }

    const backoffResult = await backOff(() => isRuntimeReady(), {
      numOfAttempts: 10,
      jitter: 'full',
      delayFirstAttempt: true,
      startingDelay: 100,
      maxDelay: 10_000
    })

    if (backoffResult.ok) {
      return Ok.EMPTY
    } else {
      return Err('runtime cannot start')
    }
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
class RuntimeNotActiveError extends VError {
  constructor(public cloudBotId: string, public runtimeStatus: string) {
    super(`runtime for bot ${cloudBotId} is ${runtimeStatus}`)
  }
}
