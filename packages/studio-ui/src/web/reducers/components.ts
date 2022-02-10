import { NLU, ComponentSnippet } from 'botpress/sdk'
import { handleActions } from 'redux-actions'
import { componentsReceived } from '~/actions'

const defaultState = {
  installed: []
}

export interface ComponentReducer {
  installed: ComponentSnippet[]
}

const reducer = handleActions(
  {
    [componentsReceived]: (state, { payload }) => ({
      ...state,
      installed: payload
    })
  },
  defaultState
)

export default reducer
