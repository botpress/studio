import * as sdk from 'botpress/sdk'
import { EntityDefCreateSchema, IntentDefCreateSchema } from 'common/validation'
import { Response as ExpressResponse } from 'express'
import { validate } from 'joi'
import _ from 'lodash'
import { StudioServices } from 'studio/studio-router'
import { CustomStudioRouter } from 'studio/utils/custom-studio-router'
import yn from 'yn'
import { BotDoesntSpeakLanguageError, BotNotMountedError } from './application/errors'

const removeSlotsFromUtterances = (utterances: { [key: string]: any }, slotNames: string[]) =>
  _.fromPairs(
    Object.entries(utterances).map(([key, val]) => {
      const regex = new RegExp(`\\[([^\\[\\]\\(\\)]+?)\\]\\((${slotNames.join('|')})\\)`, 'gi')
      return [key, val.map(u => u.replace(regex, '$1'))]
    })
  )

export class NLURouter extends CustomStudioRouter {
  constructor(services: StudioServices) {
    super('NLU', services)
  }

  setupRoutes() {
    this.router.get(
      '/languages',
      this.needPermissions('read', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const languages = await this.nluService.getLanguages()
        res.send(languages)
      })
    )

    this.router.get(
      '/intents',
      this.needPermissions('read', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const { botId } = req.params
        const intentDefs = await this.nluService.intents.getIntents(botId)
        res.send(intentDefs)
      })
    )

    this.router.get(
      '/intents/:intent',
      this.needPermissions('read', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const { botId, intent } = req.params
        const intentDef = await this.nluService.intents.getIntent(botId, intent)
        res.send(intentDef)
      })
    )

    this.router.post(
      '/intents/:intent/delete',
      this.needPermissions('write', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const { botId, intent } = req.params
        try {
          await this.nluService.intents.deleteIntent(botId, intent)
          res.sendStatus(204)
        } catch (err) {
          this.logger
            .forBot(botId)
            .attachError(err)
            .error('Could not delete intent')
          res.status(400).send(err.message)
        }
      })
    )

    this.router.post(
      '/intents',
      this.needPermissions('write', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const { botId } = req.params
        try {
          const intentDef = await validate(req.body, IntentDefCreateSchema, {
            stripUnknown: true
          })

          await this.nluService.intents.saveIntent(botId, intentDef)

          res.sendStatus(200)
        } catch (err) {
          this.logger
            .forBot(botId)
            .attachError(err)
            .warn('Cannot create intent')
          res.status(400).send(err.message)
        }
      })
    )

    this.router.post(
      '/intents/:intentName',
      this.needPermissions('write', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const { botId, intentName } = req.params
        try {
          await this.nluService.intents.updateIntent(botId, intentName, req.body)
          res.sendStatus(200)
        } catch (err) {
          this.logger
            .forBot(botId)
            .attachError(err)
            .error('Could not update intent')
          res.sendStatus(400)
        }
      })
    )

    this.router.post(
      '/condition/intentChanged',
      this.needPermissions('write', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const { botId } = req.params
        const { action } = req.body
        const condition = req.body.condition as sdk.DecisionTriggerCondition

        if (action === 'delete' || action === 'create') {
          try {
            await this.nluService.intents.updateContextsFromTopics(botId, [condition!.params!.intentName])
            return res.sendStatus(200)
          } catch (err) {
            return res.status(400).send(err.message)
          }
        }

        res.sendStatus(200)
      })
    )

    this.router.post(
      '/sync/intents/topics',
      this.needPermissions('write', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const { botId } = req.params
        const { intentNames } = req.body

        try {
          await this.nluService.intents.updateContextsFromTopics(botId, intentNames)
          res.sendStatus(200)
        } catch (err) {
          this.logger
            .forBot(botId)
            .attachError(err)
            .error('Could not update intent topics')
          res.status(400).send(err.message)
        }
      })
    )

    this.router.get(
      '/contexts',
      this.needPermissions('read', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const botId = req.params.botId
        const intents = await this.nluService.intents.getIntents(botId)
        const ctxs = _.chain(intents)
          .flatMap(i => i.contexts)
          .uniq()
          .value()

        res.send(ctxs)
      })
    )

    this.router.get(
      '/entities',
      this.needPermissions('read', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const { botId } = req.params
        const { ignoreSystem } = req.query

        const entities = await this.nluService.entities.getEntities(botId)
        const mapped = entities.map(x => ({ ...x, label: `${x.type}.${x.name}` }))

        res.json(yn(ignoreSystem) ? mapped.filter(x => x.type !== 'system') : mapped)
      })
    )

    this.router.get(
      '/entities/:entityName',
      this.needPermissions('read', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const { botId, entityName } = req.params
        try {
          const entity = await this.nluService.entities.getEntity(botId, entityName)
          res.send(entity)
        } catch (err) {
          this.logger
            .forBot(botId)
            .attachError(err)
            .error(`Could not get entity ${entityName}`)
          res.sendStatus(400)
        }
      })
    )

    this.router.post(
      '/entities',
      this.needPermissions('write', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const { botId } = req.params
        try {
          const entityDef = (await validate(req.body, EntityDefCreateSchema, {
            stripUnknown: true
          })) as sdk.NLU.EntityDefinition

          await this.nluService.entities.saveEntity(botId, entityDef)

          res.sendStatus(200)
        } catch (err) {
          this.logger
            .forBot(botId)
            .attachError(err)
            .warn('Cannot create entity')
          res.status(400).send(err.message)
        }
      })
    )

    this.router.post(
      '/entities/:id',
      this.needPermissions('write', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const { botId, id } = req.params
        try {
          const entityDef = (await validate(req.body, EntityDefCreateSchema, {
            stripUnknown: true
          })) as sdk.NLU.EntityDefinition

          await this.nluService.entities.updateEntity(botId, id, entityDef)
          res.sendStatus(200)
        } catch (err) {
          this.logger
            .forBot(botId)
            .attachError(err)
            .error('Could not update entity')
          res.status(400).send(err.message)
        }
      })
    )

    this.router.post(
      '/entities/:id/delete',
      this.needPermissions('write', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const { botId, id } = req.params
        try {
          await this.nluService.entities.deleteEntity(botId, id)

          const affectedIntents = (await this.nluService.intents.getIntents(botId)).filter(intent =>
            intent.slots.some(slot => slot.entities.includes(id))
          )

          await Promise.map(affectedIntents, intent => {
            const [affectedSlots, unaffectedSlots] = _.partition(intent.slots, slot => slot.entities.includes(id))
            const [slotsToDelete, slotsToKeep] = _.partition(affectedSlots, slot => slot.entities.length === 1)
            const updatedIntent = {
              ...intent,
              slots: [
                ...unaffectedSlots,
                ...slotsToKeep.map(slot => ({ ...slot, entities: _.without(slot.entities, id) }))
              ],
              utterances: removeSlotsFromUtterances(
                intent.utterances,
                slotsToDelete.map(slot => slot.name)
              )
            }
            return this.nluService.intents.saveIntent(botId, updatedIntent)
          })

          res.sendStatus(204)
        } catch (err) {
          this.logger
            .forBot(botId)
            .attachError(err)
            .error('Could not delete entity')
          res.status(404).send(err.message)
        }
      })
    )

    /**
     * #######################################
     * ### Trainings / Models :  Lifecycle ###
     * #######################################
     */
    this.router.get(
      '/health',
      this.asyncMiddleware(async (req, res) => {
        const health = await this.nluService.app?.getHealth()
        res.send(health)
      })
    )

    this.router.get(
      '/training/:language',
      this.needPermissions('read', 'bot.training'),
      this.asyncMiddleware(async (req, res) => {
        const { language: lang, botId } = req.params

        try {
          const state = await this.nluService.app?.getBot(botId).getTraining(lang)
          const ts = state && this.nluService.mapTrainSession({ botId, language: lang, ...state })
          res.send(ts)
        } catch (error) {
          return this._mapError({ botId, lang, error }, res)
        }
      })
    )

    this.router.post(
      ['/predict', '/predict/:lang'],
      this.asyncMiddleware(async (req, res) => {
        return res.status(410).send('Ressource gone')
      })
    )

    this.router.post(
      '/train/:lang',
      this.needPermissions('write', 'bot.training'),
      this.asyncMiddleware(async (req, res) => {
        const { botId, lang } = req.params
        try {
          const disableTraining = yn(process.env.BP_NLU_DISABLE_TRAINING)

          // to return as fast as possible
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          if (!disableTraining) {
            await this.nluService.app?.queueTraining(botId, lang)
          }
          res.sendStatus(200)
        } catch (error) {
          return this._mapError({ botId, lang, error }, res)
        }
      })
    )

    this.router.post(
      '/train/:lang/delete',
      this.needPermissions('write', 'bot.training'),
      this.asyncMiddleware(async (req, res) => {
        const { botId, lang } = req.params
        try {
          await this.nluService.app?.getBot(botId).cancelTraining(lang)
          res.sendStatus(200)
        } catch (error) {
          return this._mapError({ botId, lang, error }, res)
        }
      })
    )
  }

  private _mapError = (err: { botId: string; lang: string; error: Error }, res: ExpressResponse) => {
    const { error, botId, lang } = err

    if (error instanceof BotNotMountedError) {
      return res.status(404).send(`Bot "${botId}" doesn't exist`)
    }

    if (error instanceof BotDoesntSpeakLanguageError) {
      return res.status(422).send(`Language "${lang}" is either not supported by bot or by language server`)
    }

    const msg = 'An unexpected error occured.'
    this.logger
      .forBot(botId)
      .attachError(error)
      .error(msg)
    return res.status(500).send(msg)
  }
}
