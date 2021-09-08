import { lang } from 'botpress/shared'

import en from './en.json'
import es from './es.json'
import fr from './fr.json'
const translations = { en, fr, es }

const initializeTranslations = () => {
  lang.extend(translations)
  lang.init()
}

// Copied from https://github.com/botpress/botpress/blob/master/modules/channel-web/src/views/lite/utils.tsx
const rtlLocales = [
  'ae' /* Avestan */,
  'ar' /* 'العربية', Arabic */,
  'arc' /* Aramaic */,
  'bcc' /* 'بلوچی مکرانی', Southern Balochi */,
  'bqi' /* 'بختياري', Bakthiari */,
  'ckb' /* 'Soranî / کوردی', Sorani */,
  'dv' /* Dhivehi */,
  'fa' /* 'فارسی', Persian */,
  'glk' /* 'گیلکی', Gilaki */,
  'he' /* 'עברית', Hebrew */,
  'ku' /* 'Kurdî / كوردی', Kurdish */,
  'mzn' /* 'مازِرونی', Mazanderani */,
  'nqo' /* N'Ko */,
  'pnb' /* 'پنجابی', Western Punjabi */,
  'ps' /* 'پښتو', Pashto, */,
  'sd' /* 'سنڌي', Sindhi */,
  'ug' /* 'Uyghurche / ئۇيغۇرچە', Uyghur */,
  'ur' /* 'اردو', Urdu */,
  'yi' /* 'ייִדיש', Yiddish */
]

// 'en-US' becomes ['en', '-us'] 'en' becomes ['en']
const localeRegex = /^([a-zA-Z]*)([_\-a-zA-Z]*)$/

const isRTLLocale = (locale: string | undefined | null): boolean => {
  if (!locale) {
    return false
  }
  locale = locale.toLowerCase()
  const matches = localeRegex.exec(locale)

  if (!matches) {
    return false
  }

  return rtlLocales.includes(matches[1])
}

export { initializeTranslations, isRTLLocale }
