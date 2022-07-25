import { Popover2 } from '@blueprintjs/popover2'
import { lang } from 'botpress/shared'
import classNames from 'classnames'
import React, { useEffect, useReducer } from 'react'
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
  opened: boolean
  step: number
  selectedWorkspaceId: string | null
  completed: boolean
}

type Action =
  | { type: 'popup/opened' }
  | { type: 'popup/closed' }
  | { type: 'popup/interaction'; nextOpenState: boolean }
  | { type: 'goto/step2' }
  | { type: 'goto/step3'; selectedWorkspaceId: string }
  | { type: 'postCompletedTimeout/ended' }
  | { type: 'completed' }

const initialState: State = {
  step: 1,
  isOpen: false,
  opened: false,
  selectedWorkspaceId: null,
  completed: false
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'popup/opened':
      return { ...state, opened: true }
    case 'popup/closed':
      return { ...initialState }
    case 'popup/interaction':
      return { ...state, isOpen: action.nextOpenState }
    case 'postCompletedTimeout/ended':
      return { ...state, isOpen: false }
    case 'goto/step2':
      return { ...state, step: 2 }
    case 'goto/step3':
      return { ...state, step: 3, selectedWorkspaceId: action.selectedWorkspaceId }
    case 'completed':
      return { ...state, completed: true }
    default:
      throw new Error(`unknown action: ${JSON.stringify(action)}`)
  }
}

const DeployCloudBtn = (props: Props) => {
  const [state, dispatch] = useReducer(reducer, { ...initialState })

  const { step, isOpen, selectedWorkspaceId, completed } = state

  useEffect(() => {
    let timeout: NodeJS.Timeout | undefined
    if (completed) {
      timeout = setTimeout(() => {
        dispatch({ type: 'postCompletedTimeout/ended' })
      }, 1000)
    }

    return () => {
      if (timeout) {
        clearTimeout(timeout)
      }
    }
  }, [completed])

  return (
    <>
      <Popover2
        position="bottom"
        content={
          <div>
            <h5>Deploy to Botpress Cloud</h5>
            {step === 1 && (
              <Step1Pat
                onCompleted={() => {
                  dispatch({ type: 'goto/step2' })
                }}
              />
            )}
            {step === 2 && (
              <Step2WorkspaceSelector
                onCompleted={(selectedWorkspaceId) => {
                  dispatch({ type: 'goto/step3', selectedWorkspaceId })
                }}
              />
            )}
            {step === 3 && selectedWorkspaceId !== null && (
              <Step3Deploy
                workspaceId={selectedWorkspaceId}
                onCompleted={() => {
                  dispatch({ type: 'completed' })
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
