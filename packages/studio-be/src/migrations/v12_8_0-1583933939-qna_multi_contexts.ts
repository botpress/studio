import * as sdk from 'botpress/sdk'
import { Migration, MigrationOpts } from 'core/migration'

const migration: Migration = {
  info: {
    description: 'Convert a single category to an array of contexts',
    target: 'bot',
    type: 'content'
  },
  up: async ({ ghostService, metadata: { botId, isDryRun } }: MigrationOpts): Promise<sdk.MigrationResult> => {
    let hasChanges = false

    const bpfs = ghostService.forBot(botId)
    const files = await bpfs.directoryListing('./qna', '*.json')

    for (const file of files) {
      const content = (await bpfs.readFileAsObject('./qna', file)) as any
      const { contexts, category } = content.data

      if (contexts === undefined) {
        content.data.contexts = category ? [category] : []
        delete content.data.category

        hasChanges = true

        if (!isDryRun) {
          await bpfs.upsertFile('./qna', file, JSON.stringify(content, undefined, 2), { ignoreLock: true })
        }
      }
    }

    return { success: true, hasChanges }
  }
}

export default migration
