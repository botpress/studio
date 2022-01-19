// import eslint from 'eslint-browser'
import _ from 'lodash'

import jsRange from './jsRange'

const sandboxProxies = new WeakMap()

// add libs here
export const libs = {
  _,
  Math
}

function has(target: any, key: any) {
  return true
}

function get(target: any, key: any) {
  if (key === Symbol.unscopables) {
    return undefined
  }
  return target[key]
}

function _evalToken(token: string, vars: any = {}) {
  token = token.replace(/ /g, '').replace(/;/g, '')
  // if ((eslint as any).verify(token).length) {
  //   return undefined
  // }
  if (!token) {
    return undefined
  }
  const src = `
  with (sandbox) { 
    try {
      return (${token})
    } catch {
      return undefined
    }
  }`
  try {
    // eslint-disable-next-line no-new-func
    const code = new Function('sandbox', src)

    return (function(sandbox) {
      if (!sandboxProxies.has(sandbox)) {
        const sandboxProxy = new Proxy(sandbox, { has, get })
        sandboxProxies.set(sandbox, sandboxProxy)
      }
      return code(sandboxProxies.get(sandbox))
    })({ ...vars, ...libs })
  } catch {
    return null
  }
}

export function evalString(str: string, vars: any = {}) {
  let invalid = false

  const matches = jsRange(str)
  if (!matches) {
    return str
  }

  matches.forEach(m => {
    let out = m.replace('{{', '').replace('}}', '')
    out = evalToken(out, vars)
    if (!out) {
      invalid = true
    }
    str = str.replace(m, out)
  })

  return invalid ? 'INVALID' : str
}

export function rmDelim(str: string) {
  return str.replace('{{', '').replace('}}', '')
}

export function evalToken(token: string, vars: any = {}) {
  return _evalToken(token, vars)
}

export function evalMatchToken(token: string, vars: any = {}) {
  return _evalToken(rmDelim(token), vars)
}

export function evalStrTempl(str: string, vars: any = {}) {
  let invalid = false

  const matches = jsRange(str)
  if (!matches) {
    return str
  }

  matches.forEach(m => {
    let out = rmDelim(m)
    out = _evalToken(out, vars)
    if (!out) {
      invalid = true
    }
    str = str.replace(m, out)
  })

  return invalid ? 'INVALID' : str
}
