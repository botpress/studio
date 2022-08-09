import { lang } from 'botpress/shared'
import { CDMWorkspace, CloudClient } from 'common/cloud-client'
import { UnreachableCaseError } from 'common/errors'
import React, { useEffect, useReducer } from 'react'
import { connect } from 'react-redux'
import { RootReducer } from '~/reducers'
import { WorkspaceSelector } from './workspace'

interface OwnProps {
  pat: string
  onCompleted: (selectedWorkspaceId: string) => void
}

type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = typeof mapDispatchToProps
type Props = DispatchProps & StateProps & OwnProps

type State =
  | { status: 'checking_bot_workspace' }
  | {
      status: 'fetching_available_workspaces'
    }
  | {
      status: 'received_available_workspaces'
      workspaces: CDMWorkspace[]
    }
  | {
      status: 'saving'
      selectedWorkspace: CDMWorkspace
    }

type Action =
  | { type: 'fetch_available_workspaces' }
  | { type: 'availableWorkspaces/received'; value: CDMWorkspace[] }
  | { type: 'save/clicked'; selectedWorkspace: CDMWorkspace }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'fetch_available_workspaces':
      return { status: 'fetching_available_workspaces' }
    case 'availableWorkspaces/received':
      return { status: 'received_available_workspaces', workspaces: action.value }
    case 'save/clicked':
      return { status: 'saving', ...action }
    default:
      throw new UnreachableCaseError(action)
  }
}

const WorkspaceForm = (props: Props): JSX.Element => {
  const { bot, pat, onCompleted } = props

  const [state, dispatch] = useReducer(reducer, { status: 'checking_bot_workspace' })

  const { status } = state

  const cloudClient = new CloudClient({ cloudControllerEndpoint: window.CLOUD_CONTROLLER_ENDPOINT })

  useEffect(() => {
    const ac = new AbortController()

    const fetchWorkspaces = async () => {
      const workspaces = await cloudClient.listWorkspaces({ personalAccessToken: pat, signal: ac.signal })
      dispatch({ type: 'availableWorkspaces/received', value: workspaces })
    }

    if (status === 'fetching_available_workspaces') {
      void fetchWorkspaces()
    }
    return () => ac.abort()
  }, [pat, status])

  switch (status) {
    case 'fetching_available_workspaces':
      return <div>{lang.tr('topNav.deploy.loading')}</div>
    case 'received_available_workspaces':
      const { workspaces } = state
      if (workspaces.length === 1) {
        onCompleted(state.workspaces[0].id)
        return <></>
      }
      return (
        <WorkspaceSelector
          workspaces={workspaces}
          onSaveClicked={(selectedWorkspace) => dispatch({ type: 'save/clicked', selectedWorkspace })}
        />
      )
    case 'saving':
      onCompleted(state.selectedWorkspace.id)
      return <></>
    case 'checking_bot_workspace':
      if (bot.cloud?.workspaceId) {
        onCompleted(bot.cloud.workspaceId)
      } else {
        dispatch({ type: 'fetch_available_workspaces' })
      }
      return <></>
    default:
      throw new UnreachableCaseError(status)
  }
}

const mapStateToProps = (state: RootReducer) => ({
  bot: state.bot
})

const mapDispatchToProps = {}

export default connect<StateProps, DispatchProps, OwnProps>(mapStateToProps, mapDispatchToProps)(WorkspaceForm)
