import { Categories } from 'common/typings'
import _ from 'lodash'
import { handleActions } from 'redux-actions'
import {
  receiveContentCategories,
  receiveContentItem,
  receiveContentItemsBatched,
  receiveContentItems,
  receiveContentItemsCount,
  receiveQNAContentElement
} from '~/actions'
const defaultState = {
  categories: { enabled: [], disabled: [] },
  currentItems: [],
  itemsById: {},
  itemsCount: 0
}

export default handleActions(
  {
    [receiveContentCategories]: (state, { payload }) => ({
      ...state,
      categories: payload
    }),

    [receiveContentItems]: (state, { payload }) => ({
      ...state,
      currentItems: payload
    }),

    [receiveContentItem]: (state, { payload }) => ({
      ...state,
      itemsById: {
        ...state.itemsById,
        [payload.id]: payload
      }
    }),

    [receiveContentItemsBatched]: (state, { payload }) => ({
      ...state,
      itemsById: {
        ...state.itemsById,
        ...payload
      }
    }),

    [receiveContentItemsCount]: (state, { payload }) => ({
      ...state,
      itemsCount: payload.data.count
    }),

    [receiveQNAContentElement]: (state, { payload }) => ({
      ...state,
      qnaUsage: payload
    })
  },
  defaultState
)

export interface ContentReducer {
  categories: Categories
  currentItems: any
  qnaUsage: any
}
