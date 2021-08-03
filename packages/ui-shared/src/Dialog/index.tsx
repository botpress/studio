import { Classes, Dialog } from '@blueprintjs/core'
import cx from 'classnames'
import React, { FC } from 'react'

import style from './style.scss'
import { DialogProps } from './typings'

export const Wrapper: FC<DialogProps> = props => {

  const onSubmit = e => {
    e.preventDefault()
    props.onSubmit!()
  }

  return (
    <Dialog
      className={style.dialog}
      transitionDuration={0}
      canOutsideClickClose={false}
      enforceFocus={false}
      {...props}
    >
      {props.onSubmit ? (
        <form onSubmit={onSubmit}>
          {props.children}
        </form>
      ) : (
        props.children
      )}
    </Dialog>
  )
}

export const Body = ({ children, className }: { children: any; className?: string }) => {
  return <div className={cx(Classes.DIALOG_BODY, Classes.UI_TEXT, style.dialogBody, className)}>{children}</div>
}

export const Footer = ({ children }) => {
  return (
    <div className={Classes.DIALOG_FOOTER}>
      <div className={Classes.DIALOG_FOOTER_ACTIONS}>{children}</div>
    </div>
  )
}
