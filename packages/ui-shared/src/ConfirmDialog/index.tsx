import { Button, Classes, Icon, Intent } from '@blueprintjs/core'
import React, { FC } from 'react'
import ReactDOM from 'react-dom'

import { Body, Footer, Wrapper } from '../Dialog'
import { lang } from '../translations'

import styles from './style.scss'
import { ConfirmDialogOptions, ConfirmDialogProps } from './typings'

const ConfirmDialogComponent: FC<ConfirmDialogProps> = (props) => {
  const onAccept = () => {
    removeDialog()
    props.accept?.()
    props.resolve(true)
  }

  const onDecline = () => {
    removeDialog()
    props.decline?.()
    props.resolve(false)
  }

  return (
    <Wrapper icon="warning-sign" usePortal={false} isOpen onClose={onDecline} size="sm">
      <Body>
        <Icon icon="warning-sign" iconSize={32} className={styles.icon} />
        <div>
          {props.message}
          {props.body}
        </div>
      </Body>
      <Footer>
        {props.showDecline && (
          <Button
            id="confirm-dialog-decline"
            className={Classes.BUTTON}
            type="button"
            onClick={onDecline}
            text={props.declineLabel || lang('cancel')}
            tabIndex={2}
            intent={Intent.NONE}
          />
        )}
        <Button
          id="confirm-dialog-accept"
          className={Classes.BUTTON}
          type="button"
          autoFocus
          onClick={onAccept}
          text={props.acceptLabel || lang('ok')}
          tabIndex={3}
          intent={Intent.WARNING}
        />
      </Footer>
    </Wrapper>
  )
}

const defaultConfirmOptions: ConfirmDialogOptions = {
  title: '',
  accept: () => {},
  acceptLabel: 'Confirm',
  decline: () => {},
  declineLabel: 'Decline',
  showDecline: true
}

const confirmDialog = (message: string, options: ConfirmDialogOptions): Promise<boolean> => {
  return new Promise((resolve, _reject) => {
    addDialog({ message, ...defaultConfirmOptions, ...options }, resolve)
  })
}

export default confirmDialog

function addDialog(props, resolve) {
  const body = document.getElementsByTagName('body')[0]
  const div = document.createElement('div')

  div.setAttribute('id', 'confirmDialog-container')
  div.setAttribute('class', styles.ConfirmDialogContainer)
  body.appendChild(div)

  ReactDOM.render(<ConfirmDialogComponent {...props} resolve={resolve} />, div)
}

function removeDialog() {
  const div = document.getElementById('confirmDialog-container') as HTMLElement
  const body = document.getElementsByTagName('body')[0]

  body.removeChild(div)
}
