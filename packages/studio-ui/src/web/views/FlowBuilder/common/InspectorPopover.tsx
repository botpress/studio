import { H4, Popover, PopoverInteractionKind } from '@blueprintjs/core'
import React from 'react'

import style from './style.scss'

interface Props {
  title: string
  icon: JSX.Element
  body: JSX.Element
  children: JSX.Element
}

const InspectorPopover = (props: Props) => {
  const { icon, title, body } = props
  const PopoverContent: JSX.Element = (
    <div className={style.popoverContent}>
      <H4>
        {icon} {title}
      </H4>
      <div>{body}</div>
    </div>
  )

  return (
    <Popover
      interactionKind={PopoverInteractionKind.HOVER}
      portalClassName={style.popoverPortal}
      content={PopoverContent}
      target={props.children}
      hoverOpenDelay={150}
      hoverCloseDelay={100}
      boundary="viewport"
      position="left"
      usePortal
      minimal
    />
  )
}

export default InspectorPopover
