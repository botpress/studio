import { Spinner, SpinnerSize } from '@blueprintjs/core'
import axios from 'axios'
import { NLU } from 'botpress/sdk'
import { isCDMError, UnreachableCaseError } from 'common/errors'
import React, { useEffect, useReducer } from 'react'
import { connect } from 'react-redux'
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

type State =
  | {
      status: 'train_pending'
    }
  | { status: 'training_in_progress' }
  | { status: 'upload_pending' }
  | { status: 'upload_completed' }
  | { status: 'upload_failed' }

type Action =
  | { type: 'training/started' }
  | { type: 'training/trainSessionsUpdated'; trainSessions: TrainSessions }
  | { type: 'upload/ended' }
  | { type: 'upload/failed' }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'training/started':
      return { status: 'training_in_progress' }
    case 'training/trainSessionsUpdated':
      const isTrained = computeIsTrained(action.trainSessions)
      if (isTrained) {
        return { status: 'upload_pending' }
      } else {
        return { status: 'training_in_progress' }
      }
    case 'upload/ended':
      return { status: 'upload_completed' }
    case 'upload/failed':
      return { status: 'upload_completed' }
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

  const isTrained = computeIsTrained(trainSessions)

  if (isTrained) {
    return { status: 'upload_pending' }
  } else {
    return { status: 'train_pending' }
  }
}

export const Deploy = (props: Props): JSX.Element => {
  const { pat, trainSessions, workspaceId, onCompleted } = props

  const [state, dispatch] = useReducer(reducer, props, init)

  const { status } = state

  useEffect(() => {
    const ac = new AbortController()
    const startTrain = async () => {
      for (const lang of Object.keys(trainSessions)) {
        await axios.post(`${BASE_NLU_URL}/train/${lang}`, null, { signal: ac.signal })
      }
      dispatch({ type: 'training/started' })
    }

    if (status === 'train_pending') {
      void startTrain()
    }

    return () => ac.abort()
  }, [trainSessions, status])

  useEffect(() => {
    const ac = new AbortController()

    const uploadToCloud = async () => {
      await axios
        .post(
          `${window.STUDIO_API_PATH}/cloud/deploy`,
          { personalAccessToken: pat, workspaceId },
          { signal: ac.signal }
        )
        .catch((e) => {
          if (isCDMError(e)) {
            toastFailure(e.response.data.message, Timeout.LONG)
            dispatch({ type: 'upload/failed' })
          }
          throw e
        })
        .then(() => {
          // props.fetchBotInformation()
          dispatch({ type: 'upload/ended' })
          // onCompleted()
        })
    }

    if (status === 'upload_pending') {
      void uploadToCloud()
    }

    return () => ac.abort()
  }, [status])

  useEffect(() => {
    if (status === 'training_in_progress') {
      dispatch({ type: 'training/trainSessionsUpdated', trainSessions })
    }
  }, [status, trainSessions])

  switch (status) {
    case 'train_pending':
    case 'training_in_progress':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Step status={'in-progress'} text="Training bot" />
          <Step status={'pending'} text="Uploading bot" />
        </div>
      )
    case 'upload_pending':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Step status={'completed'} text="Training bot" />
          <Step status={'in-progress'} text="Uploading bot" />
        </div>
      )
    case 'upload_completed':
      onCompleted()
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Step status={'completed'} text="Training bot" />
          <Step status={'completed'} text="Uploading bot" />
        </div>
      )
    case 'upload_failed':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Step status={'completed'} text="Training bot" />
          <Step status={'failed'} text="Uploading bot" />
        </div>
      )
    default:
      throw new UnreachableCaseError(status)
  }
}

const mapStateToProps = (state: RootReducer) => ({
  trainSessions: state.nlu.trainSessions
})

const mapDispatchToProps = {}

export default connect<StateProps, DispatchProps, OwnProps>(mapStateToProps, mapDispatchToProps)(Deploy)
