import { CustomContentType } from 'botpress/sdk'

const schema: CustomContentType = {
  extends: 'builtin_text',
  group: 'component.info-source.group',
  title: 'component.info-source.title',
  jsonSchema: {
    description: 'component.info-source.description',
    properties: {
      url: {
        type: 'string',
        title: 'component.info-source.url'
      },
      lastUpdate: {
        type: 'string',
        title: 'component.info-source.time'
      }
    }
  }
}

export default schema
