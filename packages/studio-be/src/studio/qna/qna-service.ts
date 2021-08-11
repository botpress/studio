import { Flow, Logger } from 'botpress/sdk'
import { BotService } from 'core/bots'
import { GhostService } from 'core/bpfs'
import { TYPES } from 'core/types'
import { inject, injectable, tagged } from 'inversify'
import { NLUService } from 'studio/nlu/nlu-service'

import NluStorage from './storage'

interface ScopedBots {
  [botId: string]: BotParams
}

interface BotParams {
  storage: NluStorage
  defaultLang: string
}

@injectable()
export class QNAService {
  private bots: ScopedBots = {}

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'NLUService')
    private logger: Logger,
    @inject(TYPES.GhostService)
    private bpfs: GhostService,
    @inject(TYPES.BotService)
    private botService: BotService,
    @inject(TYPES.NLUService)
    private nluService: NLUService
  ) {}

  async getBotStorage(botId: string) {
    if (!this.bots[botId]) {
      const defaultLang = (await this.botService.findBotById(botId))?.defaultLanguage || 'en'

      const storage = new NluStorage(this.nluService, this.bpfs, this.logger, botId)
      await storage.initialize()

      this.bots[botId] = { storage, defaultLang }
    }

    return this.bots[botId]
  }

  onFlowRenamed = async ({
    botId,
    previousFlowName,
    nextFlowName
  }: {
    botId: string
    previousFlowName: string
    nextFlowName: string
  }) => {
    const { storage } = await this.getBotStorage(botId)
    const questions = await storage.getQuestions({}, { limit: 0, offset: 0 })

    const updatedItems = questions.items
      .filter(q => q.data.redirectFlow === previousFlowName)
      .map(q => {
        q.data.redirectFlow = nextFlowName
        return q
      })

    for (const item of updatedItems) {
      await storage.update(item.data, item.id)
      this.logger.debug(`References to flow "${previousFlowName}" have been updated to "${nextFlowName}"`)
    }
  }

  onTopicChanged = async ({ botId, oldName, newName }: { botId: string; oldName?: string; newName?: string }) => {
    const isRenaming = !!(oldName && newName)
    const isDeleting = !newName

    if (!isRenaming && !isDeleting) {
      return
    }

    const { storage } = await this.getBotStorage(botId)
    const questions = await storage.getQuestions({ filteredContexts: [oldName] }, { limit: 150, offset: 0 })

    for (const item of questions.items) {
      const ctxIdx = item.data.contexts.indexOf(oldName!)
      if (ctxIdx !== -1) {
        item.data.contexts.splice(ctxIdx, 1)

        if (isRenaming) {
          item.data.contexts.push(newName!)
        }

        await storage.update(item.data, item.id)
      }
    }
  }

  onFlowChanged = async ({ botId, flow }: { botId: string; flow: Flow }) => {
    if (!flow?.location) {
      return
    }

    const oldFlow = await this.bpfs.forBot(botId).readFileAsObject<Flow>('./flows', flow.location)
    const { storage } = await this.getBotStorage(botId)
    const questions = await storage.getQuestions({ question: '', filteredContexts: [] }, { limit: 0, offset: 0 })

    // Detect nodes that had their name changed
    for (const oldNode of oldFlow.nodes) {
      for (const newNode of flow.nodes) {
        // Update all questions that refer to the old node name
        if (oldNode.id === newNode.id && oldNode.name !== newNode.name) {
          const updatedItems = questions.items
            .filter(q => q.data.redirectFlow === flow.name && q.data.redirectNode === oldNode.name)
            .map(q => {
              q.data.redirectNode = newNode.name
              return q
            })

          for (const item of updatedItems) {
            await storage.update(item.data, item.id)
            this.logger.debug(`References to node "${oldNode.name}" have been updated to "${newNode.name}"`)
          }
        }
      }
    }
  }
}
