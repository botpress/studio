import * as sdk from 'botpress/sdk'
import { QnaEntry, QnaItem } from 'common/typings'
import { GhostService } from 'core/bpfs'

import _ from 'lodash'
import nanoid from 'nanoid/generate'
import { NLUService } from 'studio/nlu/nlu-service'

export const NLU_PREFIX = '__qna__'

const safeId = (length = 10) => nanoid('1234567890abcdefghijklmnopqrsuvwxyz', length)

const slugify = s => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '_')

const getIntentId = id => `${NLU_PREFIX}${id}`

const makeID = (qna: QnaEntry) => {
  const firstQuestion = qna.questions[Object.keys(qna.questions)[0]][0]
  return `${safeId()}_${slugify(firstQuestion)
    .replace(/^_+/, '')
    .substring(0, 50)
    .replace(/_+$/, '')}`
}

const normalizeQuestions = (questions: string[]) =>
  questions
    .map(q =>
      q
        .replace(/[\r\n]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    )
    .filter(Boolean)

export default class Storage {
  private nluService: NLUService
  private bpfs: GhostService
  private logger: sdk.Logger
  public botId: string

  constructor(nluService, bpfs, logger, botId) {
    this.nluService = nluService
    this.bpfs = bpfs
    this.logger = logger
    this.botId = botId
  }

  async initialize() {
    await this.syncQnaToNlu()
  }

  /**
   * Creates QNA intents for each QNA item and cleanup unused qna intents.
   */
  async syncQnaToNlu(): Promise<void> {
    const allQuestions = await this.fetchQNAs()

    const allIntents = await this.nluService.intents.getIntents(this.botId)

    const leftOverQnaIntents = allIntents.filter(
      (intent: sdk.NLU.IntentDefinition) =>
        intent.name.startsWith(NLU_PREFIX) &&
        !_.find(allQuestions, q => getIntentId(q.id).toLowerCase() === intent.name)
    )
    await Promise.map(leftOverQnaIntents, (intent: sdk.NLU.IntentDefinition) =>
      this.nluService.intents.deleteIntent(this.botId, intent.name)
    )

    const qnaItemsToSync = allQuestions.filter(
      qnaItem => qnaItem.data.enabled && !_.find(allIntents, i => i.name === getIntentId(qnaItem.id).toLowerCase())
    )
    await Promise.map(qnaItemsToSync, item => this.createNLUIntentFromQnaItem(item, false))
  }

  private async createNLUIntentFromQnaItem(qnaItem: QnaItem, create: boolean): Promise<void> {
    return this._makeIntent(qnaItem, getIntentId(qnaItem.id))
  }

  private async _convertQnaToNLUIntent(qnaItem: QnaItem): Promise<void> {
    return this._makeIntent(qnaItem, qnaItem.id)
  }

  private async _makeIntent(qnaItem: QnaItem, intentName: string): Promise<void> {
    const utterances = {}
    for (const lang in qnaItem.data.questions) {
      utterances[lang] = normalizeQuestions(qnaItem.data.questions[lang])
    }

    const intent = {
      name: intentName,
      entities: [],
      contexts: qnaItem.data.contexts,
      utterances,
      slots: []
    }

    await this.nluService.intents.saveIntent(this.botId, intent)
  }

  async update(data: QnaEntry, id: string): Promise<string> {
    await this.checkForDuplicatedQuestions(data, id)
    if (!id) {
      // Updates only no inserts
      return ''
    }
    const item: QnaItem = { id, data }

    if (data.enabled) {
      await this.createNLUIntentFromQnaItem(item, false)
    } else {
      await this.deleteMatchingIntent(item.id)
    }

    await this.bpfs.forBot(this.botId).upsertFile('./qna', `${id}.json`, JSON.stringify({ id, data }, undefined, 2))

    return id
  }

  async deleteMatchingIntent(id: string) {
    try {
      await this.nluService.intents.deleteIntent(this.botId, getIntentId(id))
    } catch (err) {
      /* swallow error */
    }
  }

  async upsertItem(item: QnaItem | QnaItem[]): Promise<string[]> {
    const items = _.isArray(item) ? item : [item]
    const qnaMap: { [key: string]: QnaEntry } = {}

    items.forEach(async item => {
      if (item.id in qnaMap) {
        this.logger.warn(`Duplicate IDs found in input while batch importing: ${item.id}`)
        qnaMap[makeID(item.data)] = item.data
      } else {
        qnaMap[item.id] = item.data
      }
    })

    return Promise.map(Object.entries(qnaMap), async ([id, data]) => {
      await this.checkForDuplicatedQuestions(data, id)
      const item: QnaItem = { id, data }
      if (data.enabled) {
        await this.createNLUIntentFromQnaItem(item, true)
      }

      await this.bpfs.forBot(this.botId).upsertFile('./qna', `${id}.json`, JSON.stringify(item, undefined, 2))
      return id
    })
  }

  async insert(data: QnaEntry): Promise<string> {
    const id = makeID(data)
    await this.upsertItem({ id, data })
    return id
  }

  private async checkForDuplicatedQuestions(newItem: QnaEntry, editingQnaId?: string) {
    const qnaItems = (await this.fetchQNAs()).filter(q => !editingQnaId || q.id !== editingQnaId)

    const newQuestions = Object.values(newItem.questions).reduce((a, b) => a.concat(b), [])
    const dupes = qnaItems
      .map(item => ({
        id: item.id,
        questions: Object.values(item.data.questions).reduce((acc, arr) => [...acc, ...arr], [])
      }))
      .filter(existingQuestion => !!existingQuestion.questions.filter(q => newQuestions.includes(q)).length)

    if (dupes.length) {
      this.logger
        .forBot(this.botId)
        .warn(`These questions already exist in another entry: ${dupes.join(', ')}. Please remove duplicates`)
    }
  }

  /**
   * This will migrate questions to the new format.
   * @deprecated Questions support multiple answers since v11.3
   */
  private migrate_11_2_to_11_3(question) {
    if (!question.data.answers) {
      question.data.answers = [question.data.answer]
    }
    return question
  }

  async getQnaItem(id: string): Promise<QnaItem> {
    const filename = `${id}.json`

    const data = await this.bpfs.forBot(this.botId).readFileAsObject('./qna', filename)

    return this.migrate_11_2_to_11_3(data)
  }

  async fetchQNAs(opts?: sdk.Paging) {
    try {
      let questions = await this.bpfs.forBot(this.botId).directoryListing('./qna', '*.json')
      if (opts && opts.count) {
        questions = questions.slice(opts.start, opts.start + opts.count)
      }

      return Promise.map(questions, itemName => this.getQnaItem(itemName.replace(/\.json$/i, '')))
    } catch (err) {
      this.logger.warn(`Error while reading questions. ${err}`)
      return []
    }
  }

  async filterByContextsAndQuestion(question: string, filteredContexts: string[]) {
    const allQuestions = await this.fetchQNAs()
    const filteredQuestions = allQuestions.filter(q => {
      const { questions, contexts } = q.data

      const hasMatch =
        Object.values(questions)
          .reduce((a, b) => a.concat(b), [])
          .join('\n')
          .toLowerCase()
          .indexOf(question.toLowerCase()) !== -1

      if (!filteredContexts.length) {
        return hasMatch || q.id.includes(question)
      }

      if (!question) {
        return !!_.intersection(contexts, filteredContexts).length
      }
      return hasMatch && !!_.intersection(contexts, filteredContexts).length
    })

    return filteredQuestions.reverse()
  }

  async getQuestions(
    { question = '', filteredContexts = [] }: any,
    { limit = 50, offset = 0 }
  ): Promise<{ items: QnaItem[]; count: number }> {
    let items: QnaItem[] = []
    let count = 0

    if (!(question || filteredContexts.length)) {
      items = await this.fetchQNAs({
        start: +offset,
        count: +limit
      })
      count = await this.count()
    } else {
      const tmpQuestions = await this.filterByContextsAndQuestion(question, filteredContexts)
      items = tmpQuestions.slice(offset, offset + limit)
      count = tmpQuestions.length
    }
    return { items, count }
  }

  async getAllContentElementIds(list?: QnaItem[]): Promise<string[]> {
    const qnas = list || (await this.fetchQNAs())
    const allAnswers = _.flatMapDeep(qnas, qna => Object.values(qna.data.answers))
    return _.uniq(_.filter(allAnswers as string[], x => _.isString(x) && x.startsWith('#!')))
  }

  async getCountByTopic(): Promise<{ [context: string]: number }> {
    const qnas = await this.fetchQNAs()

    return _.countBy(qnas, x => x.data.contexts)
  }

  async getContentElementUsage(): Promise<any> {
    const qnas = await this.fetchQNAs()

    return _.reduce(
      qnas,
      (result, qna) => {
        const answers = _.flatMap(Object.values(qna.data.answers))

        _.filter(answers, x => x.startsWith('#!')).forEach(answer => {
          const values = result[answer]
          if (values) {
            values.count++
          } else {
            result[answer] = { qna: qna.id, count: 1 }
          }
        })
        return result
      },
      {}
    )
  }

  async count() {
    const questions = await this.fetchQNAs()
    return questions.length
  }

  // TODO remove batch deleter, it's done one by one anyway
  async delete(qnaId) {
    const ids = _.isArray(qnaId) ? qnaId : [qnaId]
    if (!ids.length) {
      return
    }

    const deletePromise = async (id: string): Promise<void> => {
      await this.deleteMatchingIntent(id)
      return this.bpfs.forBot(this.botId).deleteFile('./qna', `${id}.json`)
    }

    await Promise.all(ids.map(deletePromise))
  }

  async convert(qnaId: string) {
    const item = await this.getQnaItem(qnaId)
    await this._convertQnaToNLUIntent(item)
    return this.delete(qnaId)
  }
}
