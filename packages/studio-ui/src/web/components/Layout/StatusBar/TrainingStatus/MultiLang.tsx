import { Button, Popover, Position } from '@blueprintjs/core'
import { NLU } from 'botpress/sdk'
import { lang } from 'botpress/shared'
import classNames from 'classnames'
import React, { FC, useEffect, useState } from 'react'

import SingleLang from './SingleLang'
import style from './style.scss'

interface Props {
  languages: string[]
  trainSessions: { [lang: string]: NLU.TrainingSession }
}

const TrainingStatusCenter: FC<Props> = (props: Props) => {
  const { languages, trainSessions } = props

  return (
    <div className={style.trainCenter}>
      {languages.map((l) => (
        <div className={classNames(style.trainCenter_lang, style.trainStatus_message_dark)}>
          <div className={style.trainCenter_lang_code}>
            <strong>{l.toUpperCase()}</strong>
          </div>
          <SingleLang dark={true} trainSession={trainSessions[l]} trainLabel={lang.tr('statusBar.train')} />
        </div>
      ))}
    </div>
  )
}

const MultiLangTrainingStatusComponent: FC<Props> = (props: Props) => {
  const { trainSessions } = props
  const [popoverOpen, setPopoverOpen] = useState(false)
  const needsTraining = Object.values(trainSessions).some((ts) => ts.status !== 'done')
  const currentlyTraining = Object.values(trainSessions).some(
    ({ status }) => status === 'training' || status === 'training-pending'
  )
  const ready = !needsTraining && !currentlyTraining

  useEffect(() => {
    if (ready && popoverOpen) {
      // without timeout, it feels like the training is abrublty aborted
      // timeout gives time to the user to notice training complete.
      setTimeout(() => setPopoverOpen(false), 350)
    }
  }, [trainSessions])

  return (
    <React.Fragment>
      <Popover
        content={<TrainingStatusCenter {...props} />}
        minimal
        isOpen={popoverOpen}
        position={Position.TOP_RIGHT}
        canEscapeKeyClose
        onClose={() => setPopoverOpen(false)}
        fill
        modifiers={{
          preventOverflow: { enabled: true, boundariesElement: 'window' }
        }}
      >
        <div className={style.trainStatus}>
          {needsTraining && !currentlyTraining && (
            <Button
              minimal
              className={style.button}
              onClick={() => setPopoverOpen(!popoverOpen)}
              text={lang.tr('statusBar.trainChatbot')}
            />
          )}
          {currentlyTraining && (
            <span className={style.trainStatus_message_light}>{lang.tr('statusBar.training')}</span>
          )}
        </div>
      </Popover>
      {ready && <span className={style.trainStatus_message_light}>{lang.tr('statusBar.ready')}</span>}
    </React.Fragment>
  )
}

export default MultiLangTrainingStatusComponent
