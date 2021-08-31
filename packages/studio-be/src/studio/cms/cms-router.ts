import { ContentElement } from 'botpress/sdk'
import { Categories, LibraryElement, ParsedContentType } from 'common/typings'
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
          enabled: [],
          disabled: types.disabled.map(x => ({
            id: x,
            title: x
          }))
        }

        for (let i = 0; i < types.enabled.length; i++) {
          const type = types.enabled[i]
          const count = await this.cmsService.countContentElementsForContentType(botId, type.id)

          categories.enabled.push({
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

        const augmentedElements = await Promise.map(elements, this._augmentElement)
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

        res.send(await this._augmentElement(element))
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

    this.router.get(
      '/library/:lang?',
      this.checkTokenHeader,
      this.needPermissions('read', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const { botId, lang } = req.params

        const ghost = this.bpfs.forBot(botId)
        if (!(await ghost.fileExists(CONTENT_FOLDER, LIBRARY_FILE))) {
          return res.send([])
        }

        const ids = await ghost.readFileAsObject<string[]>(CONTENT_FOLDER, LIBRARY_FILE)

        const elements = await this.cmsService.listContentElements(botId, undefined, { ids, from: 0, count: -1 }, lang)
        const contentTypes = (await this.cmsService.getAllContentTypes(botId)).enabled.reduce((acc, curr) => {
          return { ...acc, [curr.id]: curr.title }
        }, {})

        return res.send(
          elements.map(x => {
            const contentType = contentTypes[x.contentType]
            return {
              path: `Content/${contentType}/${x.id}`,
              preview: x.previews[lang]?.replace(`${contentType}: `, ''),
              type: 'say_something',
              contentId: x.id
            }
          }) as LibraryElement[]
        )
      })
    )

    this.router.post(
      '/library/:contentId/delete',
      this.checkTokenHeader,
      this.needPermissions('write', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const { botId, contentId } = req.params

        const ghost = this.bpfs.forBot(botId)
        if (!(await ghost.fileExists(CONTENT_FOLDER, LIBRARY_FILE))) {
          return res.sendStatus(404)
        }

        const ids = await ghost.readFileAsObject<string[]>(CONTENT_FOLDER, LIBRARY_FILE)

        await ghost.upsertFile(
          CONTENT_FOLDER,
          LIBRARY_FILE,
          JSON.stringify(
            ids.filter(x => x !== contentId),
            undefined,
            2
          )
        )

        res.sendStatus(200)
      })
    )

    this.router.post(
      '/library/:contentId',
      this.checkTokenHeader,
      this.needPermissions('write', 'bot.content'),
      this.asyncMiddleware(async (req, res) => {
        const { botId, contentId } = req.params

        const ghost = this.bpfs.forBot(botId)

        let contentIds: string[] = []
        if (await ghost.fileExists(CONTENT_FOLDER, LIBRARY_FILE)) {
          contentIds = await ghost.readFileAsObject<string[]>(CONTENT_FOLDER, LIBRARY_FILE)
        }

        await ghost.upsertFile(CONTENT_FOLDER, LIBRARY_FILE, JSON.stringify([...contentIds, contentId], undefined, 2))

        res.sendStatus(200)
      })
    )

    /*
    this.router.get(
      '/export',
      this._checkTokenHeader,
      this._needPermissions('read', 'bot.content'),
      async (req, res) => {
        // TODO: chunk elements if there are too many of them
        const elements = await this.cms.getAllElements(req.params.botId)
        const filtered = elements.map(x => _.omit(x, ['createdBy', 'createdOn', 'modifiedOn']))

        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Content-disposition', `attachment; filename=content_${moment().format('DD-MM-YYYY')}.json`)
        res.end(JSON.stringify(filtered, undefined, 2))
      }
    )

    const upload = multer()
    this.router.post(
      '/analyzeImport',
      this._checkTokenHeader,
      this._needPermissions('write', 'bot.content'),
      upload.single('file'),
      this.asyncMiddleware(async (req: any, res) => {
        try {
          const existingElements = await this.cms.getAllElements(req.params.botId)
          const contentTypes = (await this.cms.getAllContentTypes(req.params.botId)).map(x => x.id)

          const importData = (await validate(JSON.parse(req.file.buffer), CmsImportSchema)) as ContentElement[]
          const importedContentTypes = _.uniq(importData.map(x => x.contentType))

          res.send({
            cmsCount: (existingElements && existingElements.length) || 0,
            fileCmsCount: (importData && importData.length) || 0,
            missingContentTypes: _.difference(importedContentTypes, contentTypes)
          })
        } catch (err) {
          throw new InvalidOperationError(`Error importing your file: ${err}`)
        }
      })
    )

    this.router.post(
      '/import',
      this._checkTokenHeader,
      this._needPermissions('write', 'bot.content'),
      upload.single('file'),
      async (req: any, res) => {
        if (req.body.action === 'clear_insert') {
          await this.cms.deleteAllElements(req.params.botId)
        }

        try {
          const importData: ContentElement[] = await JSON.parse(req.file.buffer)

          for (const { contentType, formData, id } of importData) {
            await this.cms.createOrUpdateContentElement(req.params.botId, contentType, formData, id)
          }

          await this.cms.loadElementsForBot(req.params.botId)
          res.sendStatus(200)
        } catch (e) {
          this.logger.attachError(e).error('JSON Import Failure')
        }
      }
    )*/
  }

  private _augmentElement = async (element: ContentElement) => {
    const contentType = await this.cmsService.getContentType(element.contentType)
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
