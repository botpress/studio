import axios from 'axios'
import { toast } from 'botpress/shared'
import { isCDMError, UnreachableCaseError } from 'common/errors'
import React, { useEffect, useReducer } from 'react'
import { connect } from 'react-redux'
import { Timeout, toastFailure } from '~/components/Shared/Utils'
import { RootReducer } from '~/reducers'
import { Status } from './deploy'
import { TrainSessions } from './types'

const BASE_NLU_URL = `${window.STUDIO_API_PATH}/nlu`

const computeIsTrained = (trainSessions: TrainSessions) =>
  Object.values(trainSessions).reduce((trained, session) => trained && session.status === 'done', true)

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

export const Deploy = (props: Props): JSX.Element => {
  const { pat, trainSessions, workspaceId, onCompleted } = props

  const [state, dispatch] = useReducer(reducer, { status: 'train_pending' })

  const { status } = state

  useEffect(() => {
    const ac = new AbortController()
    const startTrain = async () => {
      try {
        await axios.post(
          `${window.STUDIO_API_PATH}/cloud/activate`,
          { workspaceId, personalAccessToken: pat },
          { signal: ac.signal }
        )
      } catch (err) {
        if (axios.isAxiosError(err)) {
          toast.failure(err.response?.data?.message || 'An error occured while activating the bot')
        }
        throw err
      }

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
          dispatch({ type: 'upload/ended' })
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
      return <Status training="in-progress" upload="pending" />
    case 'upload_pending':
      return <Status training="completed" upload="in-progress" />
    case 'upload_completed':
      onCompleted()
      return <Status training="completed" upload="completed" />
    case 'upload_failed':
      return <Status training="completed" upload="failed" />
    default:
      throw new UnreachableCaseError(status)
  }
}

const mapStateToProps = (state: RootReducer) => ({
  trainSessions: state.nlu.trainSessions
})

const mapDispatchToProps = {}

export default connect<StateProps, DispatchProps, OwnProps>(mapStateToProps, mapDispatchToProps)(Deploy)
