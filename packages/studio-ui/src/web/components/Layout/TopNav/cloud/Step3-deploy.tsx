import { Spinner, SpinnerSize } from '@blueprintjs/core'
import axios from 'axios'
import { NLU } from 'botpress/sdk'
import React, { useEffect, useReducer } from 'react'
import { connect } from 'react-redux'
import { fetchBotInformation } from '~/actions'
import { Timeout, toastFailure } from '~/components/Shared/Utils'
import { RootReducer } from '~/reducers'

const BASE_NLU_URL = `${window.STUDIO_API_PATH}/nlu`

interface TrainSessions {
  [lang: string]: NLU.TrainingSession
}

const computeIsTrained = (trainSessions: TrainSessions) =>
  Object.values(trainSessions).reduce((trained, session) => trained && session.status === 'done', true)

type Status = 'pending' | 'in-progress' | 'completed' | 'failed'

const Step = (props: { status: Status; text: string }): JSX.Element => {
  const { status, text } = props
  const chars: { [s in Status]: string | JSX.Element } = {
    pending: '⌛',
    'in-progress': <Spinner size={SpinnerSize.SMALL} />,
    completed: '✅',
    failed: '🚫'
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
      <div>{chars[status]}</div>
      <div>{text}</div>
    </div>
  )
}

interface State {
  train: 'pending' | 'in-progress' | 'completed'
  upload: 'pending' | 'in-progress' | 'completed' | 'failed'
}

type Action =
  | { type: 'training/started' }
  | { type: 'training/trainSessionsUpdated'; trainSessions: TrainSessions }
  | { type: 'upload/ended' }
  | { type: 'upload/started' }
  | { type: 'upload/failed' }

class UnreachableCaseError extends Error {
  constructor(val: never) {
    super(`Unreachable case: ${val}`)
  }
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'training/started':
      return { ...state, train: 'in-progress' }
    case 'training/trainSessionsUpdated':
      return { ...state, train: computeIsTrained(action.trainSessions) ? 'completed' : 'in-progress' }
    case 'upload/started':
      return { ...state, upload: 'in-progress' }
    case 'upload/ended':
      return { ...state, upload: 'completed' }
    case 'upload/failed':
      return { ...state, upload: 'failed' }
    default:
      throw new UnreachableCaseError(action)
  }
}

interface OwnProps {
  pat: string
  workspaceId: string
  onCompleted: () => void
}

type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = typeof mapDispatchToProps
type Props = DispatchProps & StateProps & OwnProps

function init(props: Props): State {
  const { trainSessions } = props

  return {
    upload: 'pending',
    train: computeIsTrained(trainSessions) ? 'completed' : 'pending'
  }
}

export const Deploy = (props: Props): JSX.Element => {
  const { pat, trainSessions, workspaceId, onCompleted } = props

  const [state, dispatch] = useReducer(reducer, props, init)

  const { train, upload } = state

  useEffect(() => {
    const ac = new AbortController()
    const startTrain = async () => {
      dispatch({ type: 'training/started' })
      for (const lang of Object.keys(trainSessions)) {
        await axios.post(`${BASE_NLU_URL}/train/${lang}`, null, { signal: ac.signal })
      }
    }

    if (train === 'pending') {
      void startTrain()
    }

    return () => ac.abort()
  }, [trainSessions, train])

  useEffect(() => {
    const ac = new AbortController()

    const uploadToCloud = async () => {
      dispatch({ type: 'upload/started' })

      await axios
        .post(
          `${window.STUDIO_API_PATH}/cloud/deploy`,
          { personalAccessToken: pat, workspaceId },
          { signal: ac.signal }
        )
        .catch((e) => {
          if (axios.isAxiosError(e)) {
            toastFailure(e.message, Timeout.LONG)
            dispatch({ type: 'upload/failed' })
          }
          throw e
        })
        .then(() => {
          props.fetchBotInformation()
          dispatch({ type: 'upload/ended' })
          onCompleted()
        })
    }

    if (train === 'completed') {
      void uploadToCloud()
    }

    return () => ac.abort()
  }, [train])

  useEffect(() => {
    if (train === 'in-progress') {
      dispatch({ type: 'training/trainSessionsUpdated', trainSessions })
    }
  }, [trainSessions])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <Step status={train} text="Training bot" />
      <Step status={upload} text="Uploading bot" />
    </div>
  )
}

const mapStateToProps = (state: RootReducer) => ({
  trainSessions: state.nlu.trainSessions
})

const mapDispatchToProps = {
  fetchBotInformation
}

export default connect<StateProps, DispatchProps, OwnProps>(mapStateToProps, mapDispatchToProps)(Deploy)
