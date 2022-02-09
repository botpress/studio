import { ContentElement } from 'botpress/sdk'
import { Categories, LibraryElement } from 'common/typings'
import { DefaultSearchParams } from 'core/cms'
import _ from 'lodash'
import { StudioServices } from 'studio/studio-router'
import { CustomStudioRouter } from 'studio/utils/custom-studio-router'

const CONTENT_FOLDER = 'content-elements'
const LIBRARY_FILE = 'library.json'

export class CMSRouter extends CustomStudioRouter {
  constructor(services: StudioServices) {
    super('CMS', services)
    this.setupRoutes()
  }

  setupRoutes() {
    this.router.get(
      '/types',
      this.checkTokenHeader,
      this.needPermissions('read', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const botId = req.params.botId
        const types = await this.cmsService.getAllContentTypes(botId)
        const categories: Categories = {
          registered: [],
          unregistered: types.disabled.map((x) => ({
            id: x,
            title: x
          }))
        }

        for (let i = 0; i < types.enabled.length; i++) {
          const type = types.enabled[i]
          const count = await this.cmsService.countContentElementsForContentType(botId, type.id)

          categories.registered.push({
            id: type.id,
            count,
            title: type.title,
            hidden: type.hidden,
            schema: {
              json: type.jsonSchema,
              ui: type.uiSchema,
              title: type.title,
              renderer: type.id
            }
          })
        }

        res.send(categories)
      })
    )

    this.router.get(
      '/elements/count',
      this.checkTokenHeader,
      this.needPermissions('read', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const botId = req.params.botId
        const count = await this.cmsService.countContentElements(botId)
        res.send({ count })
      })
    )

    this.router.post(
      '/:contentType?/elements',
      this.checkTokenHeader,
      this.needPermissions('read', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const { botId, contentType } = req.params
        const { count, from, searchTerm, filters, sortOrder, ids } = req.body

        const elements = await this.cmsService.listContentElements(botId, contentType, {
          ...DefaultSearchParams,
          count: Number(count) || DefaultSearchParams.count,
          from: Number(from) || DefaultSearchParams.from,
          sortOrder: sortOrder || DefaultSearchParams.sortOrder,
          searchTerm,
          filters,
          ids
        })

        const augmentedElements = await Promise.map(elements, (el) => this._augmentElement(el, botId))
        res.send(augmentedElements)
      })
    )

    this.router.get(
      '/:contentType?/elements/count',
      this.checkTokenHeader,
      this.needPermissions('read', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const { botId, contentType } = req.params
        const count = await this.cmsService.countContentElementsForContentType(botId, contentType)
        res.send({ count })
      })
    )

    this.router.get(
      '/element/:elementId',
      this.checkTokenHeader,
      this.needPermissions('read', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const { botId, elementId } = req.params
        const element = await this.cmsService.getContentElement(botId, elementId)

        if (!element) {
          this.logger.forBot(botId).warn(`The requested element doesn't exist: "${elementId}"`)
          return res.status(404).send(`Element ${elementId} not found`)
        }

        res.send(await this._augmentElement(element, botId))
      })
    )

    this.router.post(
      '/:contentType/element/:elementId?',
      this.checkTokenHeader,
      this.needPermissions('write', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const { botId, contentType, elementId } = req.params
        const element = await this.cmsService.createOrUpdateContentElement(
          botId,
          contentType,
          req.body.formData,
          elementId
        )
        res.send(element)
      })
    )

    this.router.post(
      '/elements/bulk_delete',
      this.checkTokenHeader,
      this.needPermissions('write', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        await this.cmsService.deleteContentElements(req.params.botId, req.body)
        res.sendStatus(200)
      })
    )
  }

  private _augmentElement = async (element: ContentElement, botId: string) => {
    const contentType = await this.cmsService.getContentType(element.contentType, botId)
    return {
      ...element,
      schema: {
        json: contentType.jsonSchema,
        ui: contentType.uiSchema,
        title: contentType.title,
        renderer: contentType.id
      }
    }
  }
}
