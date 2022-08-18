import { H4, Popover, PopoverInteractionKind } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import classnames from 'classnames'
import { parseActionInstruction } from 'common/action'
import React, { FC } from 'react'

import style from './style.scss'

interface Props {
  text: string
  className: string
}

const EMPTY_OBJECT_STR = '{}'

export const ActionPopover: FC<Props> = (props) => {
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

  const PopoverContent: JSX.Element = (
    <div className={style.popoverContent}>
      <H4>⚡ {actionName}</H4>
      {!callPreview && <p>{lang.tr('studio.flow.node.actionNoArguments')}</p>}
      {!!callPreview && (
        <div>
          <p>{lang.tr('studio.flow.node.actionArguments')}</p>
          <pre>{callPreview}</pre>
        </div>
      )}
    </div>
  )

  return (
    <div>
      <Popover
        usePortal
        boundary="viewport"
        content={PopoverContent}
        interactionKind={PopoverInteractionKind.HOVER}
        minimal
        position="left"
      >
        <div className={classnames(props.className, style.fn, style['action-item'])}>
          <span className={style.icon}>⚡</span>
          <span className={style.name}>{actionName}</span>
        </div>
      </Popover>
    </div>
  )
}
