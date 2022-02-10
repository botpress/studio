import { MultiLangText } from 'botpress/sdk'
import { isEmpty, merge } from 'lodash'

import { createIntl, createIntlCache } from 'react-intl'

import en from './en.json'
import es from './es.json'
import fr from './fr.json'

const defaultLocale = 'en'
window.locale = undefined
window.intl = undefined
window.translations = {}
const cache = createIntlCache()
let isDev = false

document.addEventListener('keydown', function (event) {
  if (event.ctrlKey && event.key === 'q') {
    isDev = !isDev
    localStorage.setItem('langdebug', isDev ? 'true' : 'false')
    window.location.reload()
  }
})

const langExtend = (langs) => {
  if (isEmpty(window.translations)) {
    window.translations = { en, fr, es }
  }

  for (const [key, value] of Object.entries(langs)) {
    if (window.translations[key]) {
      merge(window.translations[key], value)
    } else {
      window.translations[key] = value
    }
  }
}

const langInit = () => {
  window.locale = getUserLocale()
  isDev = localStorage.getItem('langdebug') === 'true'

  const messages = squash(window.translations[window.locale])
  const defaultLang = squash(window.translations[defaultLocale])
  for (const key in defaultLang) {
    if (!messages[key]) {
      messages[key] = defaultLang[key]
    }
  }

  window.intl = createIntl(
    {
      locale: window.locale,
      messages,
      defaultLocale,
      onError: (err) => {
        if (isDev) {
          console.error(err)
        }
      }
    },
    cache
  )
}

const langLocale = (): string => {
  return window.locale
}

const langAvaibale = (): string[] => {
  return Object.keys(window.translations)
}

const squash = (space, root = {}, path = '') => {
  for (const [key, value] of Object.entries(space)) {
    if (typeof value === 'object' && value !== null) {
      squash(value, root, `${path}${key}.`)
    } else {
      root[path + key] = value
    }
  }
  return root
}

const getUserLocale = () => {
  const code = (str) => str.split('-')[0]
  const browserLocale = code(navigator.language || navigator['userLanguage'] || '')
  const storageLocale = code(localStorage.getItem('uiLanguage') || '')

  return window.translations[storageLocale]
    ? storageLocale
    : window.translations[browserLocale]
    ? browserLocale
    : defaultLocale
}

/**
 * Can either receive an ID, or an object with keys of supported languages
 */
const translate = (id: string | MultiLangText, values?: { [variable: string]: any }): string => {
  if (!id) {
    return ''
  }

  if (typeof id === 'object') {
    return id[window.locale] || id[defaultLocale] || ''
  }

  if (isDev) {
    return id
  } else {
    return window.intl.formatMessage({ id }, values)
  }
}

export const lang = {
  tr: translate,
  init: langInit,
  extend: langExtend,
  getLocale: langLocale,
  getAvailable: langAvaibale,
  defaultLocale
}
