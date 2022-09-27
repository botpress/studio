import { lang } from 'botpress/shared'
import cx from 'classnames'
import { parseActionInstruction } from 'common/action'
import React from 'react'
import InspectorPopover from './InspectorPopover'

import style from './style.scss'

interface Props {
  text: string
  className?: string
}

const EMPTY_OBJECT_STR = '{}'

const ExecuteCodeItem = (props: Props) => {
  const actionInstruction = parseActionInstruction(props.text.trim())
  const actionName = `${actionInstruction.actionName}`

  let callPreview: string = ''
  if (actionInstruction?.argsStr !== EMPTY_OBJECT_STR) {
    try {
      const parameters = JSON.parse(actionInstruction.argsStr)
      callPreview = JSON.stringify(parameters, null, 2)
    } catch (err) {
      console.error('[ActionPopover] Error parsing instructions:', err)
      callPreview = lang.tr('studio.flow.node.actionInstructionParsingError', { msg: err.message })
    }
  }

  const body: JSX.Element =
    callPreview === '' ? (
      <p>{lang.tr('studio.flow.node.actionNoArguments')}</p>
    ) : (
      <>
        <p>{lang.tr('studio.flow.node.actionArguments')}</p>
        <pre>{callPreview}</pre>
      </>
    )

  return (
    <InspectorPopover icon={<span>⚡</span>} body={body} title={actionName}>
      <div className={cx(props.className, style['action-item'])}>
        <span className={style.icon}>⚡</span>
        <span className={style.name}>{actionName}</span>
      </div>
    </InspectorPopover>
  )
}

export default ExecuteCodeItem
