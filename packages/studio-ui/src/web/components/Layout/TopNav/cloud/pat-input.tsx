import { Alignment, AnchorButton, Button, InputGroup, Tooltip } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import React from 'react'

import style from './style.scss'

export function PatInput(props: {
  valid: boolean
  loading?: boolean
  onChange: (pat: string) => void
  onSave: () => void
}): JSX.Element {
  const { valid, loading, onChange, onSave } = props

  return (
    <div>
      <div className={style.patContainer}>
        <InputGroup
          className={style.patInput}
          placeholder={lang.tr('topNav.deploy.enterPersonalAccessToken')}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => onChange(e.target.value)}
          rightElement={
            valid ? (
              <Button disabled icon={'tick-circle'} minimal />
            ) : (
              <Tooltip
                content={loading ? lang.tr('topNav.deploy.checkingTokenStatus') : lang.tr('topNav.deploy.tokenInvalid')}
              >
                <Button disabled icon={loading ? 'refresh' : 'error'} minimal />
              </Tooltip>
            )
          }
        />
        <Button disabled={!valid} text={lang.tr('topNav.deploy.save')} onClick={onSave} />
      </div>
      <div className={style.anchorContainer}>
        <AnchorButton
          className={style.anchor}
          text={lang.tr('topNav.deploy.createPersonalAccessToken')}
          small
          target="_blank"
          rightIcon="share"
          minimal
          href={`${window.CLOUD_CONTROLLER_FRONTEND}/settings#pats`}
          alignText={Alignment.LEFT}
        />
      </div>
    </div>
  )
}
