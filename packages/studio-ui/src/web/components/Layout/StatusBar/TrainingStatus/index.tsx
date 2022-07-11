import axios from 'axios'
import { NLU } from 'botpress/sdk'
import { lang } from 'botpress/shared'
import { Dictionary } from 'lodash'
import React, { FC, useEffect, useReducer } from 'react'
import { connect } from 'react-redux'
import { RootReducer } from '~/reducers'
import EventBus from '~/util/EventBus'

import MultiLang from './MultiLang'
import SingleLang from './SingleLang'

interface Props {
  languages: string[]
}

interface TrainStatusEvent {
  botId: string
  type: 'nlu'
  trainSession: NLU.TrainingSession
}

const trainStatusReducer = (state, action) => {
  if (action.type === 'setAllTrainSessions') {
    return action.data
  } else if (action.type === 'setTrainSession') {
    const trainSession: NLU.TrainingSession = action.data.trainSession
    return { ...state, [trainSession.language]: trainSession }
  }
}

const makeErrorTrainSession = (language: string): NLU.TrainingSession => ({
  language,
  progress: 0,
  status: 'errored',
  key: 'no-key'
})

const isTrainStatusEvent = (event: any | TrainStatusEvent): event is TrainStatusEvent =>
  event.type === 'nlu' && event.trainSession

const TrainingStatusComponent: FC<Props> = (props: Props) => {
  const { languages } = props
  const [trainSessionsState, dispatch] = useReducer(trainStatusReducer, {})

  const onStatusBarEvent = (event: any) => {
    if (isTrainStatusEvent(event) && event.botId === window.BOT_ID) {
      dispatch({ type: 'setTrainSession', data: { trainSession: event.trainSession } })
    }
  }

  const fetchTrainingSessionForLang = async (language: string): Promise<NLU.TrainingSession> => {
    try {
      return (await axios.get<NLU.TrainingSession>(`${window.BOT_API_PATH}/mod/nlu/training/${language}`)).data
    } catch (err) {
      return makeErrorTrainSession(language)
    }
  }

  useEffect(() => {
    EventBus.default.on('statusbar.event', onStatusBarEvent)
    return () => {
      EventBus.default.off('statusbar.event', onStatusBarEvent)
    }
  }, [])

  useEffect(() => {
    if (!languages) {
      return
    }

    Promise.map(languages, fetchTrainingSessionForLang)
      .then((sessions) => {
        const trainSessionBatchUpdate: Dictionary<NLU.TrainingSession> = {}
        sessions.forEach((session) => {
          trainSessionBatchUpdate[session.language] = session
        })
        dispatch({ type: 'setAllTrainSessions', data: trainSessionBatchUpdate })
      })
      .catch((err) => {}) // pretty much unreachable, error is handled in fetchTrainingSessionForLang
  }, [languages])

  //render
  if (!languages || languages.length < 1) {
    return null
  } else if (languages.length === 1) {
    return <SingleLang trainSession={trainSessionsState[languages[0]]} trainLabel={lang.tr('statusBar.trainChatbot')} />
  } else {
    return <MultiLang languages={languages} trainSessions={trainSessionsState} />
  }
}

const mapStateToProps = (state: RootReducer) => ({
  languages: state.bot.languages
})

export default connect(mapStateToProps)(TrainingStatusComponent)
