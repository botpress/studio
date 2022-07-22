import { Popover2 } from '@blueprintjs/popover2'
import { lang } from 'botpress/shared'
import classNames from 'classnames'
import React, { useReducer } from 'react'
import { connect } from 'react-redux'
import { RootReducer } from '~/reducers'
import Step1Pat from './cloud/Step1-pat'
import Step2WorkspaceSelector from './cloud/Step2-workspace'
import Step3Deploy from './cloud/Step3-deploy'

import style from './style.scss'

interface Props {
  // personalAccessToken?: string
}

interface State {
  isOpen: boolean
  isOpened: boolean
  step: number
  selectedWorkspaceId: string
}

type Action =
  | { type: 'popup/opened' }
  | { type: 'popup/closed' }
  | { type: 'popup/interaction'; nextOpenState: boolean }
  | { type: 'goto/step2' }
  | { type: 'goto/step3'; selectedWorkspaceId: string }
  | { type: 'postDeployTimeout/ended' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'popup/opened':
      return { ...state, isOpened: true, step: 1 }
    case 'popup/closed':
      return { ...state, isOpened: false }
    case 'popup/interaction':
      return { ...state, isOpen: action.nextOpenState }
    case 'postDeployTimeout/ended':
      return { ...state, isOpen: false }
    case 'goto/step2':
      return { ...state, step: 2 }
    case 'goto/step3':
      return { ...state, step: 3, selectedWorkspaceId: action.selectedWorkspaceId }
    default:
      throw new Error(`unknown action: ${JSON.stringify(action)}`)
  }
}

const DeployCloudBtn = (props: Props) => {
  const [state, dispatch] = useReducer(reducer, {
    step: 1,
    isOpen: false,
    isOpened: false,
    selectedWorkspaceId: null
  })

  const { step, isOpen, isOpened, selectedWorkspaceId } = state

  return (
    <>
      <Popover2
        position="bottom"
        content={
          <div>
            <h5>Deploy to Botpress Cloud</h5>
            {isOpened && step === 1 && (
              <Step1Pat
                onCompleted={() => {
                  dispatch({ type: 'goto/step2' })
                }}
              />
            )}
            {isOpened && step === 2 && (
              <Step2WorkspaceSelector
                onCompleted={(selectedWorkspaceId) => {
                  dispatch({ type: 'goto/step3', selectedWorkspaceId })
                }}
              />
            )}
            {isOpened && step === 3 && (
              <Step3Deploy
                workspaceId={selectedWorkspaceId}
                onCompleted={() => {
                  setTimeout(() => {
                    dispatch({ type: 'postDeployTimeout/ended' })
                  }, 1000)
                }}
              />
            )}
          </div>
        }
        interactionKind="click"
        matchTargetWidth={false}
        isOpen={isOpen}
        onOpened={() => {
          dispatch({ type: 'popup/opened' })
        }}
        onClosed={() => {
          dispatch({ type: 'popup/closed' })
        }}
        onInteraction={(nextOpenState) => {
          dispatch({ type: 'popup/interaction', nextOpenState })
        }}
      >
        <button
          className={classNames(style.item, { [style.disabled]: false }, style.itemSpacing)}
          id="statusbar_deploy"
        >
          <span className={style.label}>{lang.tr('topNav.deploy.btn')}</span>
        </button>
      </Popover2>
    </>
  )
}

const mapStateToProps = (state: RootReducer) => ({})

export default connect(mapStateToProps)(DeployCloudBtn)
