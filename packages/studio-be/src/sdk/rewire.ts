import _ from 'lodash'
import Module from 'module'
import syspath from 'path'

const originalRequire = Module.prototype.require

function addToNodePath(path: string) {
  overwritePaths(getPaths().concat(path))
}

function reloadPaths() {
  ;(Module as any)._initPaths() // eslint-disable-line
}

function getPaths(): string[] {
  const currentPath = process.env.NODE_PATH || ''
  return currentPath
    .split(syspath.delimiter)
    .filter(Boolean)
    .map((x) => x.trim())
}

function overwritePaths(paths: string[]) {
  process.env.NODE_PATH = _.uniq(paths).join(syspath.delimiter)
  reloadPaths()
}

// @ts-ignore
global.require = {
  addToNodePath,
  getPaths,
  overwritePaths
}

addToNodePath(syspath.resolve(__dirname, '../')) // 'bp/' directory

const rewire = function (this: NodeRequireFunction, mod: string) {
  if (mod === 'botpress/sdk') {
    return originalRequire.apply(this, ['core/app/sdk_impl'])
  }

  return originalRequire.apply(this, arguments as never as [string])
}

Module.prototype.require = rewire as any
