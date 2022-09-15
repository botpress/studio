import { ContentElement } from 'botpress/sdk'
import { Categories } from 'common/typings'
import _, { Dictionary } from 'lodash'
import { handleActions } from 'redux-actions'
import {
  receiveContentCategories,
  receiveContentItem,
  receiveContentItemsBatched,
  receiveContentItems,
  receiveContentItemsCount,
  receiveQNAContentElement
} from '~/actions'

export interface ContentReducer {
  categories: Categories
  currentItems: ContentElement[]
  itemsById: Dictionary<ContentElement>
  itemsCount: number
  qnaUsage: any
}

const defaultState: ContentReducer = {
  categories: { registered: [], unregistered: [] },
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
