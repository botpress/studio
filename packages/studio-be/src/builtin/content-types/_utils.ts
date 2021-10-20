import path from 'path'
import url from 'url'

const isBpUrl = str => {
  const re = /^\/api\/.*\/bots\/.*\/media\/.*/
  return re.test(str)
}

export default {
  formatURL: (baseUrl, url) => {
    return isBpUrl(url) ? `${baseUrl}${url}` : url
  },
  isUrl: str => {
    try {
      new url.URL(str)
      return true
    } catch {
      return false
    }
  },
  extractPayload: (type, data) => {
    const payload = {
      type,
      ...data
    }

    delete payload.event
    delete payload.temp
    delete payload.user
    delete payload.session
    delete payload.bot
    delete payload.BOT_URL

    return payload
  },
  extractFileName: file => {
    let fileName = path.basename(file)
    if (fileName.includes('-')) {
      fileName = fileName
        .split('-')
        .slice(1)
        .join('-')
    }

    return fileName
  }
}
