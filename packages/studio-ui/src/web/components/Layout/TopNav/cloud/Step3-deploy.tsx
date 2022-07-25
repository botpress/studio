import axios from 'axios'
import { NLU } from 'botpress/sdk'
import React, { useEffect, useReducer } from 'react'
import { connect } from 'react-redux'
import { fetchBotInformation } from '~/actions'
import { RootReducer } from '~/reducers'

const BASE_NLU_URL = `${window.STUDIO_API_PATH}/nlu`

interface TrainSessions {
  [lang: string]: NLU.TrainingSession
}

const computeIsTrained = (trainSessions: TrainSessions) =>
  Object.values(trainSessions).reduce((trained, session) => trained && session.status === 'done', true)

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

interface State {
  train: 'pending' | 'in-progress' | 'completed'
  upload: 'pending' | 'in-progress' | 'completed'
}

type Action =
  | { type: 'training/started' }
  | { type: 'training/trainSessionsUpdated'; trainSessions: TrainSessions }
  | { type: 'upload/ended' }
  | { type: 'upload/started' }

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
    default:
      throw new Error(`unknown action: ${JSON.stringify(action)}`)
  }
}

interface OwnProps {
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

export const Deploy = (props: Props) => {
  const { trainSessions, workspaceId, onCompleted } = props

  const [state, dispatch] = useReducer(reducer, props, init)

  const { train, upload } = state

  useEffect(() => {
    const startTrain = async () => {
      dispatch({ type: 'training/started' })
      for (const lang of Object.keys(trainSessions)) {
        await axios.post(`${BASE_NLU_URL}/train/${lang}`)
      }
    }

    if (train === 'pending') {
      void startTrain()
    }
  }, [trainSessions, train])

  useEffect(() => {
    const uploadToCloud = async () => {
      dispatch({ type: 'upload/started' })
      await axios.post(`${window.STUDIO_API_PATH}/cloud/deploy`, { workspaceId })
      props.fetchBotInformation()
      dispatch({ type: 'upload/ended' })
      onCompleted()
    }

    if (train === 'completed') {
      void uploadToCloud()
    }
  }, [train])

  useEffect(() => {
    if (train === 'in-progress') {
      dispatch({ type: 'training/trainSessionsUpdated', trainSessions })
    }
  }, [trainSessions])

  return (
    <div>
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
