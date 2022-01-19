import _ from 'lodash'
import vm from 'vm'

import jsRange from './jsRange'

// add libs here
export const libs = {
  _,
  Math
}

const timeout = 1500 // timeout in ms

function _evalToken(token: string, vars: any = {}) {
  try {
    return vm.runInNewContext(token, { ...vars, ...libs }, { timeout })
  } catch {
    return undefined
  }
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
  if (!matches) return str

  matches.forEach(m => {
    let out = rmDelim(m)
    out = _evalToken(out, vars)
    if (!out) invalid = true
    str = str.replace(m, out)
  })

  return invalid ? 'INVALID' : str
}
