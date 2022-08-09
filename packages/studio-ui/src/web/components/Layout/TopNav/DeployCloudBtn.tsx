import { Icon, Popover } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import classNames from 'classnames'
import { UnreachableCaseError } from 'common/errors'
import React, { useEffect, useReducer } from 'react'
import { connect } from 'react-redux'
import { RootReducer } from '~/reducers'
import { Status } from './cloud/deploy'
import Step1Pat from './cloud/Step1-pat'
import Step2WorkspaceSelector from './cloud/Step2-workspace'
import Step3Deploy from './cloud/Step3-deploy'

import style from './style.scss'

interface OwnProps {
  onCompleted: () => void
}

type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = typeof mapDispatchToProps
type Props = DispatchProps & StateProps & OwnProps

interface State {
  isOpen: boolean
  opened: boolean
  selectedWorkspaceId: string | null
  pat: string | null
  completed: boolean
}

type Action =
  | { type: 'popup/opened' }
  | { type: 'popup/closed' }
  | { type: 'popup/interaction'; nextOpenState: boolean }
  | { type: 'pat/received'; pat: string }
  | { type: 'workspaceId/received'; selectedWorkspaceId: string }
  | { type: 'completed' }
  | { type: 'postCompletedTimeout/ended' }

const initialState: State = {
  isOpen: false,
  opened: false,
  selectedWorkspaceId: null,
  pat: null,
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
    case 'workspaceId/received':
      return { ...state, selectedWorkspaceId: action.selectedWorkspaceId }
    case 'completed':
      return { ...state, completed: true }
    case 'pat/received':
      return { ...state, pat: action.pat }
    default:
      throw new UnreachableCaseError(action)
  }
}

const DeployCloudBtn = (props: Props) => {
  const [state, dispatch] = useReducer(reducer, { ...initialState })

  const { isOpen, selectedWorkspaceId, completed, pat } = state

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
      <Popover
        position="bottom"
        content={
          <div className={style.popoverContent}>
            {!pat && (
              <Step1Pat
                onCompleted={(pat) => {
                  dispatch({ type: 'pat/received', pat })
                }}
              />
            )}
            {pat && !selectedWorkspaceId && (
              <Step2WorkspaceSelector
                pat={pat}
                onCompleted={(selectedWorkspaceId) => {
                  dispatch({ type: 'workspaceId/received', selectedWorkspaceId })
                }}
              />
            )}
            {pat && selectedWorkspaceId && !completed && (
              <Step3Deploy
                pat={pat}
                workspaceId={selectedWorkspaceId}
                onCompleted={() => {
                  dispatch({ type: 'completed' })
                }}
              />
            )}
            {completed && <Status training="completed" upload="completed" />}
          </div>
        }
        interactionKind="click"
        isOpen={isOpen}
        onOpened={() => {
          dispatch({ type: 'popup/opened' })
        }}
        onClosed={() => {
          dispatch({ type: 'popup/closed' })
          props.onCompleted()
        }}
        onInteraction={(nextOpenState) => {
          dispatch({ type: 'popup/interaction', nextOpenState })
        }}
      >
        <button className={classNames(style.item, style.itemSpacing)}>
          <Icon color="#1a1e22" icon="cloud-upload" iconSize={16} />
          <span className={style.label}>{lang.tr('topNav.deploy.btn')}</span>
        </button>
      </Popover>
    </>
  )
}

const mapStateToProps = (state: RootReducer) => ({
  user: state.user
})

const mapDispatchToProps = {}

export default connect<StateProps, DispatchProps, OwnProps>(mapStateToProps, mapDispatchToProps)(DeployCloudBtn)
