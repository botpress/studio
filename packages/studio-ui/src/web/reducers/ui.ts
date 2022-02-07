import { utils } from 'botpress/shared'
import _ from 'lodash'
import { handleActions } from 'redux-actions'
import {
  addDocumentationHint,
  removeDocumentationHint,
  setEmulatorOpen,
  toggleBottomPanelExpand,
  toggleBottomPanel,
  toggleInspector,
  toggleExplorer,
  updateDocumentationModal,
  updateGlobalStyle,
  viewModeChanged,
  zoomToLevel
} from '~/actions'

export interface UiReducer {
  viewMode: any
  docHints: string[]
  explorerOpen: boolean
  emulatorOpen: boolean
  zoomLevel: number
  bottomPanel: boolean
  bottomPanelExpanded: boolean
  inspectorEnabled: boolean
  setEmulatorOpen: (newState: boolean) => void
}

const bottomPanelStorageKey = `bp::${window.BOT_ID}::bottom-panel-open`
const inspectorEnabledStorageKey = `bp::${window.BOT_ID}::enable-inspector`
const explorerStorageKey = `bp::${window.BOT_ID}::explorer-open`

const defaultBottomPanelOpen = utils.storage.get<boolean>(bottomPanelStorageKey) === true
const defaultInspectorEnabled = utils.storage.get<boolean>(inspectorEnabledStorageKey) === true
const defaultExplorerOpen = utils.storage.get<boolean>(explorerStorageKey) === true

const defaultState = {
  viewMode: -1,
  customStyle: {},
  docHints: [],
  docModal: null,
  bottomPanel: defaultBottomPanelOpen || false,
  bottomPanelExpanded: false,
  inspectorEnabled: defaultInspectorEnabled,
  explorerOpen: defaultExplorerOpen,
  emulatorOpen: false,
  zoomLevel: 100
}

const reducer = handleActions(
  {
    [viewModeChanged]: (state, { payload }) => ({
      ...state,
      viewMode: payload.toString()
    }),
    [updateGlobalStyle]: (state, { payload }) => ({
      ...state,
      customStyle: Object.assign({}, state.customStyle, payload)
    }),
    [addDocumentationHint]: (state, { payload }) => ({
      ...state,
      docHints: _.uniq([payload, ...state.docHints])
    }),
    [removeDocumentationHint]: (state, { payload }) => ({
      ...state,
      docHints: _.without(state.docHints, payload)
    }),
    [updateDocumentationModal]: (state, { payload }) => ({
      ...state,
      docModal: payload
    }),
    [toggleBottomPanelExpand]: (state) => ({
      ...state,
      bottomPanelExpanded: !state.bottomPanelExpanded
    }),
    [toggleBottomPanel]: (state, {}) => {
      const value = !state.bottomPanel
      localStorage.setItem(bottomPanelStorageKey, value.toString())
      return {
        ...state,
        bottomPanel: value
      }
    },
    [toggleInspector]: (state, {}) => {
      const value = !state.inspectorEnabled
      localStorage.setItem(inspectorEnabledStorageKey, value.toString())
      return {
        ...state,
        inspectorEnabled: value
      }
    },
    [toggleExplorer]: (state, {}) => {
      const value = !state.explorerOpen
      localStorage.setItem(explorerStorageKey, value.toString())
      return {
        ...state,
        explorerOpen: value
      }
    },
    [zoomToLevel]: (state, { payload }) => {
      return {
        ...state,
        zoomLevel: payload
      }
    },
    [setEmulatorOpen]: (state, { payload }) => ({
      ...state,
      emulatorOpen: payload
    })
  },
  defaultState
)

export default reducer
