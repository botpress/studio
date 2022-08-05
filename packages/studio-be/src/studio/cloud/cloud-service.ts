import { CloudConfig } from 'botpress/sdk'
import { UnreachableCaseError } from 'common/errors'
import { BotService } from 'core/bots'
import { backOff } from 'exponential-backoff'
import FormData from 'form-data'
import _ from 'lodash'
import { Result, ok, err } from 'neverthrow'
import { NLUService } from 'studio/nlu'
import { CloudClient, MAX_BODY_CLOUD_BOT_SIZE } from './cloud-client'
import { CDMConflictError, CreateBotError, RuntimeNotActiveError, UnexpectedError } from './errors'
import { Bot } from './types'

export class CloudService {
  constructor(private cloudClient: CloudClient, private botService: BotService, private nluService: NLUService) {}

  public async deployBot(props: {
    botId: string
    workspaceId: string
    personalAccessToken: string
  }): Promise<Result<null, 'message too large' | 'no bot config' | 'invalid pat' | CreateBotError>> {
    const { personalAccessToken, workspaceId, botId } = props

    const botConfig = await this.botService.findBotById(botId)
    if (!botConfig) {
      return err('no bot config')
    }

    let cloudBotId: string
    let clientId: string
    let clientSecret: string

    if (botConfig.cloud?.botId) {
      // if botId is already set, we assume it's a cloud bot
      cloudBotId = botConfig.cloud.botId
      clientId = botConfig.cloud.clientId
      clientSecret = botConfig.cloud.clientSecret
    } else {
      // otherwise, we try finding a matching bot (by name) in the cloud
      let cloudBot: Bot | undefined
      const cloudWorkspaceBots = await this.cloudClient.listBots({ personalAccessToken, workspaceId })
      const matchingBot = cloudWorkspaceBots.find((b) => b.name === botId)

      if (!matchingBot) {
        // no matching bot found, we create a new one in the cloud
        const result = await this.cloudClient.createBot({
          personalAccessToken,
          name: botId,
          workspaceId
        })
        if (result.isErr()) {
          const { error: val } = result

          if (val instanceof CDMConflictError) {
            return err(new CreateBotError({ cause: val }, 'Conflict while creating bot'))
          }

          if (val instanceof UnexpectedError) {
            return err(new CreateBotError({ cause: val }, 'Could not create bot'))
          }

          throw new UnreachableCaseError(val)
        } else {
          cloudBot = result.value
          cloudBotId = cloudBot.id
          clientId = cloudBot.apiKey.id
          clientSecret = cloudBot.apiKey.secret
        }
      } else {
        cloudBot = matchingBot
        cloudBotId = cloudBot.id
        clientId = cloudBot.apiKey.id
        clientSecret = cloudBot.apiKey.secret
      }

      // save the cloud bot info in the bot config
      await this.botService.updateBot(botId, {
        cloud: { botId: cloudBotId, clientId: cloudBot.apiKey.id, clientSecret: cloudBot.apiKey.secret, workspaceId }
      })
    }

    const botMultipart = await this.makeBotUploadPayload({ botId })
    if (Buffer.byteLength(botMultipart.getBuffer()) > MAX_BODY_CLOUD_BOT_SIZE) {
      return err('message too large')
    }

    await this.waitUntilBotUploadable({ cloudBotId, clientId, clientSecret })
    await this.cloudClient.uploadBot({ botMultipart, botId: cloudBotId, personalAccessToken })

    return ok(null)
  }

  private async waitUntilBotUploadable(props: {
    cloudBotId: string
    clientId: CloudConfig['clientId']
    clientSecret: CloudConfig['clientSecret']
  }): Promise<Result<null, 'no oauthAccessToken' | 'runtime cannot start'>> {
    const { cloudBotId, clientId, clientSecret } = props

    const oauthAccessToken = await this.cloudClient.getAccessToken({ clientId, clientSecret })
    if (!oauthAccessToken) {
      return err('no oauthAccessToken')
    }

    const isRuntimeReady = async (): Promise<Result<null, RuntimeNotActiveError>> => {
      const { runtimeStatus } = await this.cloudClient.getIntrospect({ oauthAccessToken, clientId })
      if (runtimeStatus !== 'ACTIVE') {
        return err(new RuntimeNotActiveError(cloudBotId, runtimeStatus))
      }

      return ok(null)
    }

    const backoffResult = await backOff(() => isRuntimeReady(), {
      numOfAttempts: 10,
      jitter: 'full',
      delayFirstAttempt: true,
      startingDelay: 100,
      maxDelay: 10_000
    })

    if (backoffResult.isOk()) {
      return ok(null)
    } else {
      return err('runtime cannot start')
    }
  }

  private async makeBotUploadPayload(props: { botId: string }): Promise<FormData> {
    const { botId } = props
    await this.nluService.downloadAndSaveModelWeights(botId)

    const botBlob = await this.botService.exportBot(botId, { cloud: true })

    const botMultipart = new FormData()
    botMultipart.append('botArchive', botBlob, 'bot.tgz')

    return botMultipart
  }
}
