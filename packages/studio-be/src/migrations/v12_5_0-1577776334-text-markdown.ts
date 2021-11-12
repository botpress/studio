import * as sdk from 'botpress/sdk'
import { Migration, MigrationOpts } from 'core/migration'

const ELEMENTS_DIR = 'content-elements'

const migration: Migration = {
  info: {
    description: 'Enable markdown by default for all text messages',
    target: 'bot',
    type: 'content'
  },
  up: async ({ ghostService, metadata: { botId, isDryRun } }: MigrationOpts): Promise<sdk.MigrationResult> => {
    let hasChanges = false
    const checkFile = (fileContent: string, nbElements: number) => {
      const parsed = JSON.parse(fileContent)
      return parsed.length === nbElements
    }

    const updateFormData = ({ formData }: sdk.ContentElement) => {
      for (const key of Object.keys(formData)) {
        if (key.startsWith('text$')) {
          const language = key.substr(key.indexOf('$') + 1, key.length)
          const markdownKey = 'markdown$' + language

          if (!(markdownKey in formData)) {
            formData[markdownKey] = true
            hasChanges = true
          }
        }
      }
    }

    const bpfs = ghostService.forBot(botId)
    const entFiles = await bpfs.directoryListing(ELEMENTS_DIR, '*.json')

    for (const fileName of entFiles) {
      try {
        const contentElements = await bpfs.readFileAsObject<sdk.ContentElement[]>(ELEMENTS_DIR, fileName, {
          noCache: true
        })

        contentElements.forEach(element => updateFormData(element))

        const fileContent = JSON.stringify(contentElements, undefined, 2)

        // Just double-checking before writing the content back
        if (checkFile(fileContent, contentElements.length)) {
          if (!isDryRun) {
            await bpfs.upsertFile(ELEMENTS_DIR, fileName, fileContent, { ignoreLock: true })
          }
        }
      } catch (err) {
        console.error(`Error processing file ${fileName} for bot ${botId}`)
      }
    }

    return { success: true, hasChanges }
  }
}

export default migration
