import axios from 'axios'
import { NLU } from 'botpress/sdk'
import { Dictionary } from 'lodash'
import React, { FC, useEffect, useState } from 'react'
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

const isTrainStatusEvent = (event: any | TrainStatusEvent): event is TrainStatusEvent =>
  event.type === 'nlu' && event.trainSession

const TrainingStatusComponent: FC<Props> = (props: Props) => {
  const { languages } = props
  const [trainSessions, setTrainSessions] = useState<Dictionary<NLU.TrainingSession>>({})

  const onStatusBarEvent = (event: any) => {
    if (isTrainStatusEvent(event) && event.botId === window.BOT_ID) {
      setTrainSessions({ ...trainSessions, [event.trainSession.language]: event.trainSession })
    }
  }

  const fetchTrainingSessionForLang = async (language: string) => {
    try {
      const { data: session } = await axios.get(`${window.BOT_API_PATH}/mod/nlu/training/${language}`)
      return session as NLU.TrainingSession
    } catch (err) {
      return {
        language,
        progress: 0,
        status: 'errored'
      } as NLU.TrainingSession
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
        setTrainSessions({ ...trainSessions, ...trainSessionBatchUpdate })
      })
      .catch((err) => {})
  }, [languages])

  //render
  if (!languages || languages.length < 1) {
    return null
  } else if (languages.length === 1) {
    return <SingleLang trainSession={trainSessions[languages[0]]} />
  } else {
    return <MultiLang languages={languages} trainSessions={trainSessions} />
  }
}

const mapStateToProps = (state: RootReducer) => ({
  languages: state.bot.languages
})

export default connect(mapStateToProps)(TrainingStatusComponent)
