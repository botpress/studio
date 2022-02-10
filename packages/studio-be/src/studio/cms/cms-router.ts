import { ContentElement, ContentType, SearchParams } from 'botpress/sdk'

import _ from 'lodash'
import { StudioServices } from 'studio/studio-router'
import { Instance } from 'studio/utils/bpfs'
import { CustomStudioRouter } from 'studio/utils/custom-studio-router'
import path from 'path'
import { nanoid } from 'nanoid'

export enum ButtonAction {
  SaySomething = 'Say something',
  OpenUrl = 'Open URL',
  Postback = 'Postback'
}

export const DefaultSearchParams: SearchParams = {
  sortOrder: [{ column: 'createdOn' }],
  from: 0,
  count: 50
}

type ContentElementsByType = { type: string; elements: ContentElement[] }[]
type ContentTypesMap = { [key: string]: ContentType }

// TODO: botConfig.contentTypes should be removed ... if you want to disable a contentType, delete the content type from the content-types folder
// TODO: in the UI, we'll do most of these operations front-end

export class CMSRouter extends CustomStudioRouter {
  private contentElementsWithPreviews: ContentElementsByType | null = null

  constructor(services: StudioServices) {
    super('CMS', services.logger)
    this.setupRoutes()
  }

  // types are static .. load them once in memory
  // elements can be loaded with bpfs at query time

  async loadContentTypes(): Promise<ContentTypesMap> {
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

  async loadContentElements(): Promise<ContentElementsByType> {
    const files = await Instance.directoryListing('content-elements', {})

    const elementByTypes = await Promise.map(files, async (file) => {
      const content = await Instance.readFile(path.join('content-elements', file))
      return { type: file.replace(/\.json$/i, ''), elements: JSON.parse(content.toString()) as ContentElement[] }
    })

    return elementByTypes
  }

  async getContentElementsWithPreviews(): Promise<ContentElementsByType> {
    if (!this.contentElementsWithPreviews) {
      const elements = await this.loadContentElements()
      const types = await this.loadContentTypes()
      this.contentElementsWithPreviews = this.computeElementPreviews(elements, types, 'en', ['en', 'fr']) // TODO: provide languages and default lang
    }

    return this.contentElementsWithPreviews
  }

  async upsertContentElement(contentType: string, content: ContentElement) {
    const file = path.join('content-elements', contentType)
    const buffer = await Instance.readFile(file)
    const elements = JSON.parse(buffer.toString()) as ContentElement[]
    const newElements = [...elements.filter((x) => x.id !== content.id), { ...content }]
    await Instance.upsertFile(file, JSON.stringify(newElements, undefined, 2))

    // Refresh previews
    this.contentElementsWithPreviews = null
    await this.getContentElementsWithPreviews()
  }

  async deleteContentElementsById(elementIds: string[]) {
    const types = await this.loadContentTypes()

    for (let type in types) {
      const file = path.join('content-elements', type)
      const buffer = await Instance.readFile(file)
      const elements = JSON.parse(buffer.toString()) as ContentElement[]

      const newElements = [...elements]
      const removed = _.remove(newElements, (x) => elementIds.includes(x.id))

      // TODO: Delete unreferenced medias in (removed[])

      await Instance.upsertFile(file, JSON.stringify(newElements, undefined, 2))
    }

    // Refresh previews
    this.contentElementsWithPreviews = null
    await this.getContentElementsWithPreviews()
  }

  async getContentElementById(elementId: string): Promise<ContentElement> {
    const typesById = await this.loadContentTypes()
    const allElements = await this.getContentElementsWithPreviews()

    for (let current of allElements) {
      const element = current.elements.find((x) => x.id === elementId)
      if (!element) continue

      return {
        ...element,
        schema: {
          json: typesById[current.type].jsonSchema,
          ui: typesById[current.type].uiSchema,
          title: typesById[current.type].title,
          renderer: typesById[current.type].id
        }
      }
    }

    throw new Error(`Content element "${elementId}" not found`)
  }

  computeElementPreviews(
    elements: ContentElementsByType,
    types: ContentTypesMap,
    defaultLanguage: string,
    languages: string[]
  ): ContentElementsByType {
    // TODO: Refactor this whole thing

    let recursiveProtection = 0
    const elementsById = elements.reduce((acc, curr) => {
      curr.elements.forEach((el) => (acc[el.id] = el))
      return acc
    }, {})

    const resolveRef = (data: any) => {
      if (recursiveProtection++ >= 10) {
        return '[error: circular dependency]'
      }

      if (!data) {
        return data
      }

      if (Array.isArray(data)) {
        return data.map(resolveRef)
      }

      if (_.isObject(data)) {
        return _.mapValues(data, resolveRef)
      }

      if (_.isString(data)) {
        const m = data.match(/^##ref\((.*)\)$/)
        const refId = m && m[1]
        if (!refId || !elementsById[refId]) {
          return data
        }
        return resolveRef(elementsById[refId].formData)
      }
    }

    const getOriginalProps = (expandedFormData: any, lang: string, contentType: ContentType) => {
      const originalProps = Object.keys(_.get(contentType, 'jsonSchema.properties'))

      // When data is accessible through a single key containing the '$' separator. e.g. { 'text$en': '...' }
      const separatorExtraction = (prop: string) =>
        expandedFormData[`${prop}$${lang}`] || (defaultLanguage && expandedFormData[`${prop}$${defaultLanguage}`])

      // When data is accessible through keys of a nested dictionary. e.g. { 'text': { 'en': '...' } }
      const nestedDictExtraction = (prop: string) =>
        expandedFormData[prop] &&
        (expandedFormData[prop][lang] || (defaultLanguage && expandedFormData[prop][defaultLanguage]))

      if (originalProps) {
        return originalProps.reduce(
          (result, prop) => ((result[prop] = separatorExtraction(prop) || nestedDictExtraction(prop)), result),
          {}
        )
      } else {
        return expandedFormData
      }
    }

    // TODO: add BOT_URL
    const context = { BOT_ID: '' }

    const computed: ContentElementsByType = []
    for (let type of elements) {
      const temp = { type: type.type, elements: [] as ContentElement[] }
      const contentType = types[type.type]
      for (let element of type.elements) {
        recursiveProtection = 0 // reset recursive counter that prevents circular dependencies between elements
        const expandedFormData = resolveRef(element.formData)

        const previews = languages.reduce((result, lang) => {
          if (!contentType || !contentType.computePreviewText) {
            result[lang] = 'No preview'
            return result
          }

          const translated = getOriginalProps(expandedFormData, lang, contentType)
          let preview = contentType.computePreviewText({ ...translated, ...context })

          if (!preview) {
            const defaultTranslation = getOriginalProps(expandedFormData, defaultLanguage, contentType)
            preview = `(missing translation) ${contentType.computePreviewText({
              ...defaultTranslation,
              ...context
            })}`
          }

          result[lang] = preview
          return result
        }, {})

        temp.elements.push({ ...element, ...{ previews } })
      }
      computed.push(temp)
    }

    return computed
  }

  setupRoutes() {
    this.router.get(
      '/types',
      this.checkTokenHeader,
      this.needPermissions('read', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const botId = req.params.botId

        const typesById = await this.loadContentTypes()
        const allElements = await this.getContentElementsWithPreviews()

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

        const allElements = await this.getContentElementsWithPreviews()

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
        const allElements = await this.getContentElementsWithPreviews()
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

        const allElements = await this.getContentElementsWithPreviews()

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

        try {
          const element = await this.getContentElementById(elementId)
          res.send(element)
        } catch (e) {
          this.logger.warn(`The requested element doesn't exist: "${elementId}"`)
          return res.status(404).send(`Element ${elementId} not found`)
        }
      })
    )

    this.router.post(
      '/:contentType/element/:elementId?',
      this.checkTokenHeader,
      this.needPermissions('write', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const { botId, contentType, elementId } = req.params

        // This is an upsert method, ie, you can create a new element or update one

        // TODO: The UI should send all the formData in all languages instead of just one language
        // TODO: The UI should generate an ID for new content instead of backend.. there's no value in having it unknown upfront
        // TODO: the UI should set the createdOn, modifiedOn, createdBy

        // TODO: do we need to broadcast change to other services? [flows, QNA, skills]
        // TODO: getCurrentBot() --> {}
        // TODO: get languages and defaultLang necessary for computing previews

        const formData = { ...req.body.formData }
        formData['id'] = formData['id'] || elementId || `${contentType.replace('#', '')}-${nanoid(6)}`
        await this.upsertContentElement(contentType, formData)

        const element = await this.getContentElementById(formData.id)
        res.send(element)
      })
    )

    this.router.post(
      '/elements/bulk_delete',
      this.checkTokenHeader,
      this.needPermissions('write', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const ids = req.body as string[]
        await this.deleteContentElementsById(ids)
        res.sendStatus(200)
      })
    )
  }
}
