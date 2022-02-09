import { ContentElement } from 'botpress/sdk'
import { Categories, LibraryElement } from 'common/typings'
import { DefaultSearchParams } from 'core/cms'
import _ from 'lodash'
import { StudioServices } from 'studio/studio-router'
import { Instance } from 'studio/utils/bpfs'
import { CustomStudioRouter } from 'studio/utils/custom-studio-router'
import path from 'path'

export enum ButtonAction {
  SaySomething = 'Say something',
  OpenUrl = 'Open URL',
  Postback = 'Postback'
}

// TODO: botConfig.contentTypes should be removed ... if you want to disable a contentType, delete the content type from the content-types folder
// TODO: in the UI, we'll do most of these operations front-end

export class CMSRouter extends CustomStudioRouter {
  constructor(services: StudioServices) {
    super('CMS', services)
    this.setupRoutes()
  }

  // types are static .. load them once in memory
  // elements can be loaded with bpfs at query time

  async loadContentTypes() {
    const files = (await Instance.directoryListing('content-types', {})) //
      .filter((file) => !file.startsWith('_')) // content types starting with _ are shared code

    const types = await Promise.map(files, async (file) => {
      const content = require(path.join('content-types', file)) // TODO: does that actually work?
      return content
    })

    // return a map of content types by id, e.g.
    // { "builtin_text": {...} }
    return types.reduce((acc, curr) => {
      acc[curr.id] = curr
      return acc
    }, {})
  }

  async loadContentElements(): Promise<{ type: string; elements: ContentElement[] }[]> {
    const files = await Instance.directoryListing('content-elements', {})

    const elementByTypes = await Promise.map(files, async (file) => {
      const content = await Instance.readFile(path.join('content-elements', file))
      return { type: file.replace(/\.json$/i, ''), elements: JSON.parse(content.toString()) as ContentElement[] }
    })

    return elementByTypes
  }

  async loadContentElements(): Promise<{ type: string; elements: ContentElement[] }[]> {
    const files = await Instance.directoryListing('content-elements', {})

    const elementByTypes = await Promise.map(files, async (file) => {
      const content = await Instance.readFile(path.join('content-elements', file))
      return { type: file.replace(/\.json$/i, ''), elements: JSON.parse(content.toString()) as ContentElement[] }
    })

    return elementByTypes
  }

  setupRoutes() {
    this.router.get(
      '/types',
      this.checkTokenHeader,
      this.needPermissions('read', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const botId = req.params.botId

        const typesById = await this.loadContentTypes()
        const allElements = await this.loadContentElements()

        return Object.keys(typesById).map((type) => ({
          id: type,
          count: allElements.find((x) => x.type === type)?.elements?.length,
          title: typesById[type].title,
          hidden: typesById[type].hidden,
          schema: {
            json: typesById[type].jsonSchema,
            ui: typesById[type].uiSchema,
            title: typesById[type].title,
            renderer: type
          }
        }))
      })
    )

    this.router.get(
      '/elements/count',
      this.checkTokenHeader,
      this.needPermissions('read', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const botId = req.params.botId

        const allElements = await this.loadContentElements()

        const count = allElements.reduce((acc, curr) => {
          return acc + curr.elements.length
        }, 0)

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

        const typesById = await this.loadContentTypes()
        const allElements = await this.loadContentElements()
        const type = typesById[contentType]

        const elements = allElements.find((x) => x.type === contentType)?.elements || []

        // TODO: Move content translation logic to front-end (_translateElement)

        const params = {
          ...DefaultSearchParams,
          count: Number(count) || DefaultSearchParams.count,
          from: Number(from) || DefaultSearchParams.from,
          searchTerm,
          ids
        }

        let sorted = _.sortBy(elements, 'createdOn')

        if (params.searchTerm) {
          // TODO: Look it's 1am
          sorted = sorted.filter((x) => x.id.includes(searchTerm) || JSON.stringify(x.formData).includes(searchTerm))
        }

        if (params.ids) {
          sorted = sorted.filter((x) => params.ids.includes(x.id))
        }

        if (params.from) {
          sorted = sorted.slice(params.from)
        }

        if (params.count) {
          sorted = sorted.slice(0, params.count)
        }

        return sorted.map((element) => ({
          ...element,
          schema: {
            json: type.jsonSchema,
            ui: type.uiSchema,
            title: type.title,
            renderer: type.id
          }
        }))
      })
    )

    this.router.get(
      '/:contentType?/elements/count',
      this.checkTokenHeader,
      this.needPermissions('read', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const { botId, contentType } = req.params

        const allElements = await this.loadContentElements()

        const count = allElements.find((x) => x.type === contentType)?.elements?.length || 0

        res.send({ count })
      })
    )

    this.router.get(
      '/element/:elementId',
      this.checkTokenHeader,
      this.needPermissions('read', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const { botId, elementId } = req.params

        const typesById = await this.loadContentTypes()
        const allElements = await this.loadContentElements()

        for (let current of allElements) {
          const element = current.elements.find((x) => x.id === elementId)
          if (!element) continue

          res.send({
            ...element,
            schema: {
              json: typesById[current.type].jsonSchema,
              ui: typesById[current.type].uiSchema,
              title: typesById[current.type].title,
              renderer: typesById[current.type].id
            }
          })
        }

        this.logger.forBot(botId).warn(`The requested element doesn't exist: "${elementId}"`)
        return res.status(404).send(`Element ${elementId} not found`)
      })
    )

    this.router.post(
      '/:contentType/element/:elementId?',
      this.checkTokenHeader,
      this.needPermissions('write', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const { botId, contentType, elementId } = req.params

        // TODO: broadcast change?
        // TODO: get languages and defaultLang necessary for computing previews

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
