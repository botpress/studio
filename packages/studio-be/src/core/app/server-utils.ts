import { Request } from 'express-serve-static-core'
import fs from 'fs'
import _ from 'lodash'
import path from 'path'

const debug = DEBUG('api')
const debugRequest = debug.sub('request')

export const debugRequestMw = (req: Request, _res, next) => {
  debugRequest(`${req.path} %o`, {
    method: req.method,
    ip: req.ip,
    originalUrl: req.originalUrl
  })

  next()
}

const indexCache: { [pageUrl: string]: string } = {}

// Dynamically updates the static paths of index files
export const resolveIndexPaths = (page: string) => (req, res) => {
  res.contentType('text/html')

  fs.readFile(resolveStudioAsset(page), (err, data) => {
    if (data) {
      indexCache[page] = data.toString()

      res.send(indexCache[page])
    } else {
      res.sendStatus(404)
    }
  })
}

export const resolveStudioAsset = (file: string) => {
  if (!process.pkg) {
    return path.resolve(process.PROJECT_LOCATION, '../../studio-ui/', file)
  }

  return path.resolve(process.TEMP_LOCATION, 'assets/studio/ui', file)
}
