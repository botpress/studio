import { handleActions } from 'redux-actions'
import { botInfoReceived, changeContentLanguage, receiveModuleTranslations } from '~/actions'
import { isRTLLocale } from '~/translations'

export interface LanguageReducer {
  contentLang: string
  isRTLContentLang: boolean
  translations: any | undefined
}

const defaultState: LanguageReducer = {
  contentLang: 'en',
  isRTLContentLang: false,
  translations: undefined
}

const reducer = handleActions(
  {
    [changeContentLanguage]: (state, { payload }) => ({
      ...state,
      ...payload,
      isRTLContentLang: isRTLLocale(payload.contentLang)
    }),
    [botInfoReceived]: (state, { payload }) => ({
      ...state,
      contentLang: payload.defaultLanguage,
      isRTLContentLang: isRTLLocale(payload.defaultLanguage)
    }),
    [receiveModuleTranslations]: (state, { payload }) => ({ ...state, translations: payload })
  },
  defaultState
)

export default reducer
