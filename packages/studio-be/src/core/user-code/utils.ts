import { requireAtPaths } from 'core/modules/utils/require'
import path from 'path'

export const getBaseLookupPaths = (fullPath: string, lastPathPart: string) => {
  const actionLocation = path.dirname(fullPath)

  let parts = path.relative(process.PROJECT_LOCATION, actionLocation).split(path.sep)
  parts = parts.slice(parts.indexOf(lastPathPart) + 1) // We only keep the parts after /actions/...

  const lookups: string[] = [actionLocation, path.join(process.PROJECT_LOCATION, 'shared_libs')]

  return lookups
}

export const prepareRequire = (fullPath: string, lookups: string[]) => {
  return module => requireAtPaths(module, lookups, fullPath)
}

export const enabled = (filename: string) => !path.basename(filename).startsWith('.')

export const actionServerIdRegex = /^[a-zA-Z0-9]*$/
