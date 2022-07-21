/* eslint-disable no-console */
import { Icon, Tooltip, Spinner, Button } from '@blueprintjs/core'
import { Popover2, Tooltip2 } from '@blueprintjs/popover2'
import axios from 'axios'
import sdk, { NLU } from 'botpress/sdk'
import { lang, toast } from 'botpress/shared'
import classNames from 'classnames'
import moment from 'moment'
import React, { useCallback, useEffect, useReducer, useState } from 'react'
import { connect } from 'react-redux'
import { RootReducer } from '~/reducers'

import style from './style.scss'

const BASE_NLU_URL = `${window.STUDIO_API_PATH}/nlu`

interface TrainSessions {
  [lang: string]: NLU.TrainingSession
}

interface Props {
  bot: sdk.BotConfig
  trainSessions: TrainSessions
  personalAccessToken?: string
}

const NeedTraining = () => {
  return <div className={style.tooltip}>{lang.tr('topNav.deploy.tooltip.needsTraining')}</div>
}

const TrainSessionDisplay = (props: { trainSession: NLU.TrainingSession }): JSX.Element => {
  const { trainSession } = props
  return (
    <div>
      <div>{trainSession.language}</div>
      <div>{trainSession.progress}</div>
      <div>{trainSession.status}</div>
    </div>
  )
}

const WorkspaceSelector = (props: {
  onWorkspaceChanged: (selectedWorkspace: any) => void
  cloudWorkspaces: any[]
}): JSX.Element => {
  const { cloudWorkspaces, onWorkspaceChanged } = props
  return (
    <div>
      <select onChange={(e) => onWorkspaceChanged(cloudWorkspaces.find((w) => w.id === e.target.value))}>
        {cloudWorkspaces.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name}
          </option>
        ))}
      </select>
    </div>
  )
}

const TrainSessionsDisplay = (props: { status: 'pending' | 'completed' }): JSX.Element => {
  const { status } = props
  return (
    <div>
      {status === 'pending' && (
        <div>
          <Spinner />
          Training ...
        </div>
      )}
      {status === 'completed' && <p>✅ Trained</p>}
    </div>
  )
}

const DeployBotDisplay = (props: { status: 'pending' | 'completed' }): JSX.Element => {
  const { status } = props
  return (
    <div>
      {status === 'pending' && (
        <div>
          <Spinner />
          Deploying ...
        </div>
      )}
      {status === 'completed' && <p>✅ Deployed</p>}
    </div>
  )
}

type Status = 'pending' | 'in-progress' | 'completed'

const Step = (props: { status: Status; text: string }): JSX.Element => {
  const { status, text } = props
  const chars: { [s in Status]: string } = {
    pending: '⌛',
    'in-progress': '🔄',
    completed: '✅'
  }
  return (
    <p>
      {chars[status]} {text}
    </p>
  )
}

type Workspace = any

interface State {
  isOpen: boolean
  isOpened: boolean
  isTrained: boolean
  workspaces: Workspace[]
  selectedWorkspace: Workspace
  userAuthenticated: boolean
  training: 'pending' | 'in-progress' | 'completed'
  upload: 'pending' | 'in-progress' | 'completed'
}

const computeIsTrained = (trainSessions: TrainSessions) =>
  Object.values(trainSessions).reduce((trained, session) => trained && session.status === 'done', true)

function init(props: Props): State {
  const { trainSessions } = props
  const isTrained = computeIsTrained(trainSessions)

  return {
    isOpen: false,
    isOpened: false,
    isTrained,
    workspaces: [],
    selectedWorkspace: null,
    userAuthenticated: false,
    upload: 'pending',
    training: 'pending'
  }
}

type Action =
  | { type: 'postDeployTimeout/ended' }
  | { type: 'popup/opened' }
  | { type: 'popup/closed' }
  | { type: 'deployButton/clicked' }
  | { type: 'training/started' }
  | { type: 'training/ended' }
  | { type: 'training/trainSessionsUpdated'; trainSessions: TrainSessions }
  | { type: 'workspaces/fetched'; workspaces: State['workspaces'] }
  | { type: 'userAuthentication/fetched'; authenticated: boolean }
  | { type: 'workspace/selected'; workspace: Workspace }
  | { type: 'upload/ended' }
  | { type: 'upload/started' }
  | { type: 'popup/interaction'; nextOpenState: boolean }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'popup/opened':
      return { ...state, isOpened: true, training: 'pending', upload: 'pending' }
    case 'popup/closed':
      return { ...state, isOpened: false }
    case 'popup/interaction':
      return { ...state, isOpen: action.nextOpenState }
    case 'deployButton/clicked':
      return { ...state }
    case 'workspaces/fetched':
      return { ...state, workspaces: action.workspaces }
    case 'userAuthentication/fetched':
      return { ...state, userAuthenticated: action.authenticated }
    case 'workspace/selected':
      return { ...state, selectedWorkspace: action.workspace }
    case 'upload/started':
      return { ...state, upload: 'in-progress' }
    case 'upload/ended':
      return { ...state, upload: 'completed' }
    case 'postDeployTimeout/ended':
      return { ...state, isOpen: false }
    case 'training/trainSessionsUpdated':
      return { ...state, isTrained: computeIsTrained(action.trainSessions) }
    case 'training/started':
      return { ...state, training: 'in-progress' }
    default:
      throw new Error(`unknown action: ${JSON.stringify(action)}`)
  }
}

const DeployCloudBtn = (props: Props) => {
  const { trainSessions, bot, personalAccessToken } = props

  const [state, dispatch] = useReducer(reducer, props, init)

  const { userAuthenticated, workspaces, isOpened, isOpen, isTrained, training, upload, selectedWorkspace } = state

  // effects
  useEffect(() => {
    const checkUserAuthentication = async () => {
      console.log('calling checkUserAuthentication()')
      const resp = await axios.get(`${window.CLOUD_CONTROLLER_ENDPOINT}/v1/authentication/pat`, {
        headers: { Authorization: `bearer ${personalAccessToken}` }
      })

      dispatch({
        type: 'userAuthentication/fetched',
        authenticated: resp.status === 200 && resp.headers['x-user-id'] !== undefined
      })
    }

    void checkUserAuthentication()
  }, [])

  useEffect(() => {
    const fetchWorkspaces = async () => {
      console.log('fetching workspaces')
      const { data: workspaces } = await axios.get(`${window.CLOUD_CONTROLLER_ENDPOINT}/v1/workspaces`, {
        headers: { Authorization: `bearer ${personalAccessToken}` }
      })
      dispatch({ type: 'workspaces/fetched', workspaces })
    }

    if (userAuthenticated) {
      void fetchWorkspaces()
    }
  }, [userAuthenticated])

  useEffect(() => {
    const train = async () => {
      console.log('train() called')
      dispatch({ type: 'training/started' })
      for (const [lang, trainSession] of Object.entries(trainSessions)) {
        await axios.post(`${BASE_NLU_URL}/train/${lang}`)
      }
    }

    if (isOpened && userAuthenticated && !isTrained) {
      void train()
    }
  }, [isOpened, userAuthenticated, isTrained])

  useEffect(() => {
    if (isOpened && (isTrained || training === 'completed') && workspaces.length > 0) {
      void deployToCloud()
    }
  }, [isOpened, isTrained, training, workspaces])

  useEffect(() => {
    if (upload === 'completed') {
      setTimeout(() => {
        dispatch({ type: 'postDeployTimeout/ended' })
      }, 1000)
    }
  }, [upload])

  useEffect(() => {
    dispatch({ type: 'training/trainSessionsUpdated', trainSessions })
  }, [trainSessions])

  const deployToCloud = async () => {
    console.log('calling /deploy')
    const w = bot.cloud ? workspaces.find((w: any) => w.id === bot.cloud.workspaceId) : workspaces[0]
    dispatch({ type: 'upload/started' })
    await axios.post(`${window.STUDIO_API_PATH}/cloud/deploy`, { workspaceId: w.id })
    dispatch({ type: 'upload/ended' })
  }

  return (
    <>
      <Popover2
        position="bottom"
        content={
          <div>
            <h5>Deploy to Botpress Cloud</h5>
            <p>User authenticated: {`${userAuthenticated}`}</p>
            {!bot.cloud && (
              <div>
                <WorkspaceSelector
                  cloudWorkspaces={workspaces}
                  onWorkspaceChanged={(ws) => {
                    dispatch({ type: 'workspace/selected', workspace: ws })
                  }}
                />
                <Button text="Deploy" onClick={() => dispatch({ type: 'deployButton/clicked' })} />
              </div>
            )}
            {bot.cloud && (
              <div>
                <Step status={isTrained ? 'completed' : training ? 'in-progress' : 'pending'} text="Training bot" />
                <Step status={upload} text="Uploading bot" />
              </div>
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

const mapStateToProps = (state: RootReducer) => ({
  bot: state.bot,
  trainSessions: state.nlu.trainSessions,
  personalAccessToken: state.user.personalAccessToken
})

export default connect(mapStateToProps)(DeployCloudBtn)
