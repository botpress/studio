import { handleActions } from 'redux-actions'
import { loadedComponent, loadingComponent } from '~/actions'

export interface LoaderReducer {
  loading: boolean
}

const defaultState: LoaderReducer = {
  loading: false
}

const reducer = handleActions(
  {
    [loadingComponent]: (state) => ({
      ...state,
      loading: true
    }),
    [loadedComponent]: (state) => ({
      ...state,
      loading: false
    })
  },
  defaultState
)

export default reducer
