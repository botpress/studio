import { CloudConfig } from 'botpress/sdk'
import { UnreachableCaseError } from 'common/errors'
import { BotService } from 'core/bots'
import { backOff } from 'exponential-backoff'
import FormData from 'form-data'
import _ from 'lodash'
import { Result, ok, err } from 'neverthrow'
import { NLUService } from 'studio/nlu'
import VError from 'verror'
import { CloudClient, MAX_BODY_CLOUD_BOT_SIZE } from './cloud-client'
import { Bot, RuntimeStatus } from './types'

class CreateBotError extends VError {
  readonly name = 'create_bot'

  constructor(options: VError.Options, message: string) {
    super(options, `Error while creating bot: ${message}`)
  }
}

class InvalidPatError extends VError {
  readonly name = 'invalid_pat'
  constructor() {
    super('Invalid PAT')
  }
}

class NoBotConfigError extends VError {
  readonly name = 'no_bot_config'
  constructor() {
    super('No bot config')
  }
}

class MessageTooLargeError extends VError {
  readonly name = 'message_too_large'
  public readonly info: { actualSize: number; maxSize: number }

  constructor(props: { actualSize: number; maxSize: number }) {
    super('Message too large')
    this.info = props
  }
}

class RuntimeCannotStartError extends VError {
  readonly name = 'runtime_cannot_start'
  constructor() {
    super('Runtime cannot start')
  }
}

class NoOauthAccessTokenError extends VError {
  readonly name = 'no_oauth_access_token'
  constructor() {
    super('No oauth access token')
  }
}

class RuntimeNotActiveError extends VError {
  readonly name = 'runtime_not_active'
  readonly info: { cloudBotId: string; runtimeStatus: RuntimeStatus }

  constructor(props: { cloudBotId: string; runtimeStatus: RuntimeStatus }) {
    super(`Runtime for bot ${props.cloudBotId} is ${props.runtimeStatus}`)

    this.info = props
  }
}

class BotNotUploadableError extends VError {
  readonly name = 'bot_not_uploadable'

  constructor(cause: WaitUntilBotUploadableError) {
    super({ cause }, 'Bot not uploadable')
  }
}

type DeployBotError = MessageTooLargeError | NoBotConfigError | InvalidPatError | CreateBotError | BotNotUploadableError

type WaitUntilBotUploadableError = RuntimeCannotStartError | NoOauthAccessTokenError

export class CloudService {
  constructor(private cloudClient: CloudClient, private botService: BotService, private nluService: NLUService) {}

  public async deployBot(props: {
    botId: string
    workspaceId: string
    personalAccessToken: string
  }): Promise<Result<null, DeployBotError>> {
    const { personalAccessToken, workspaceId, botId } = props

    const botConfig = await this.botService.findBotById(botId)
    if (!botConfig) {
      return err(new NoBotConfigError())
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
          const { error } = result
          switch (error.name) {
            case 'unexpected_error':
              return err(new CreateBotError({ cause: error }, 'Unexpected error'))
            case 'cdm_conflict_error':
              return err(new CreateBotError({ cause: error }, 'Conflict error'))
            default:
              throw new UnreachableCaseError(error.name)
          }
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
    const actualSize = Buffer.byteLength(botMultipart.getBuffer())
    if (actualSize > MAX_BODY_CLOUD_BOT_SIZE) {
      return err(new MessageTooLargeError({ actualSize, maxSize: MAX_BODY_CLOUD_BOT_SIZE }))
    }

    const botWaitResult = await this.waitUntilBotUploadable({ cloudBotId, clientId, clientSecret })
    if (botWaitResult.isErr()) {
      const { error } = botWaitResult
      switch (error.name) {
        case 'runtime_cannot_start':
          return err(new BotNotUploadableError(error))
        case 'no_oauth_access_token':
          return err(new BotNotUploadableError(error))
        default:
          throw new UnreachableCaseError(error)
      }
    }

    await this.cloudClient.uploadBot({ botMultipart, botId: cloudBotId, personalAccessToken })

    return ok(null)
  }

  private async waitUntilBotUploadable(props: {
    cloudBotId: string
    clientId: CloudConfig['clientId']
    clientSecret: CloudConfig['clientSecret']
  }): Promise<Result<null, WaitUntilBotUploadableError>> {
    const { cloudBotId, clientId, clientSecret } = props

    const oauthAccessToken = await this.cloudClient.getAccessToken({ clientId, clientSecret })
    if (!oauthAccessToken) {
      return err(new NoOauthAccessTokenError())
    }

    const isRuntimeReady = async (): Promise<Result<null, RuntimeNotActiveError>> => {
      const { runtimeStatus } = await this.cloudClient.getIntrospect({ oauthAccessToken, clientId })
      if (runtimeStatus !== 'ACTIVE') {
        return err(new RuntimeNotActiveError({ cloudBotId, runtimeStatus }))
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
      return err(new RuntimeCannotStartError())
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
