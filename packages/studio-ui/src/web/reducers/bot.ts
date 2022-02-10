import { BotConfig } from 'botpress/sdk'
import { handleActions } from 'redux-actions'

import { botInfoReceived, botLicenseReceived } from '~/actions'

const defaultState = {
  bot: {},
  license: false
}

export interface BotReducer {
  bot: BotConfig
  // TODO cleanup
  //  type and name for "license" this might change
  license: any
}

const reducer = handleActions<BotReducer, string>(
  {
    [botInfoReceived]: (state, { payload }) => ({ ...state, bot: payload }),
    [botLicenseReceived]: (state, { payload }) => ({ ...state, license: payload })
  },
  defaultState
)

export default reducer
