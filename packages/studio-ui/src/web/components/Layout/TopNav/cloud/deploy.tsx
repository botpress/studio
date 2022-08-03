import { Spinner, SpinnerSize } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import React from 'react'

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

export const Status = (props: { training: Status; upload: Status }): JSX.Element => {
  const { training, upload } = props

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <Step status={training} text={lang.tr('topNav.deploy.trainingBot')} />
      <Step status={upload} text={lang.tr('topNav.deploy.uploadingBot')} />
    </div>
  )
}
