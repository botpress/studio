import _ from 'lodash'
import { customAlphabet } from 'nanoid'

export const hashCode = (str) => {
  let hash = 0
  if (str.length === 0) {
    return hash
  }

  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i)
    hash = (hash << 5) - hash + chr
    hash |= 0
  }
  return hash
}

// https://davidwalsh.name/caret-end
export const moveCursorToEnd = (el) => {
  if (!el) {
    return
  }

  if (typeof el.selectionStart == 'number') {
    el.selectionStart = el.selectionEnd = el.value.length
    el.focus()
  } else if (typeof el.createTextRange != 'undefined') {
    el.focus()
    const range = el.createTextRange()
    range.collapse(false)
    range.select()
  }
}

export const prettyId = (length = 10) => customAlphabet('1234567890abcdef', length)()

export const downloadBlob = (name, blob) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', name)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export const parseBotId = () => {
  const botIdRegex = /^\/(studio|lite)\/(.+?)\//i
  let matches = window.location.pathname.match(botIdRegex)
  if (!matches || matches.length < 3 || !matches[1]) {
    matches = (window.BP_BASE_PATH + '/').match(botIdRegex)
  }
  return (matches && matches[2]) || ''
}

export const sanitizeName = (text: string) =>
  text
    .replace(/\s/g, '-')
    .replace(/[^a-zA-Z0-9\/_-]/g, '')
    .replace(/\/\//, '/')

export const stripDots = (str: string) => str.replace(/\./g, '--dot--')

export const restoreDots = (str: string) => str.replace(/--dot--/g, '.')

export const recursiveSearch = (obj: any, searchKey: string, results: string[] = []) => {
  if (!obj || typeof obj !== 'object') {
    return results
  }

  Object.keys(obj).forEach((key) => {
    const value = obj[key]
    if (key === searchKey && typeof value !== 'object') {
      results.push(value)
    } else if (typeof value === 'object') {
      recursiveSearch(value, searchKey, results)
    }
  })
  return results
}
