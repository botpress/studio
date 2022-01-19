import React from 'react'
import { IPanelProps } from './types'

const EvalPanel = ({ valid, text }: IPanelProps) => {
  return (
    <div
      className={`bp-editor-panel ${valid === null ? 'no-globs' : valid ? 'valid' : 'invalid'}`}
      // eslint-disable-next-line no-console
      onMouseDown={e => console.log(e)}
    >
      <p>{text}</p>
    </div>
  )
}

export default EvalPanel
