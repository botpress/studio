import * as sdk from 'botpress/sdk'
import { Migration, MigrationOpts } from 'core/migration'

const migration: Migration = {
  info: {
    description: 'Convert a single category to an array of contexts',
    target: 'bot',
    type: 'content'
  },
  up: async ({ botService, ghostService, metadata }: MigrationOpts): Promise<sdk.MigrationResult> => {
    let hasChanges = false

    const updateBot = async (botId: string) => {
      const bpfs = ghostService.forBot(botId)
      const files = await bpfs.directoryListing('./qna', '*.json')

      for (const file of files) {
        const content = (await bpfs.readFileAsObject('./qna', file)) as any
        const { contexts, category } = content.data

        if (contexts === undefined) {
          content.data.contexts = category ? [category] : []
          delete content.data.category

          await bpfs.upsertFile('./qna', file, JSON.stringify(content, undefined, 2), { ignoreLock: true })
          hasChanges = true
        }
      }
    }

    if (metadata.botId) {
      await updateBot(metadata.botId)
    } else {
      const bots = await botService.getBots()
      for (const botId of Array.from(bots.keys())) {
        await updateBot(botId)
      }
    }

    return {
      success: true,
      message: hasChanges ? 'Field converted successfully' : 'Field is already converted, skipping...'
    }
  }
}

export default migration
