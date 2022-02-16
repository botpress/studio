import React from 'react'

import { PanelProps } from './types'

const EvalPanel = ({ valid, text }: PanelProps) => {
  return (
    <div className={`bp-editor-panel ${valid === null ? 'no-eventState' : valid ? 'valid' : 'invalid'}`}>{text}</div>
  )
}

export default EvalPanel
