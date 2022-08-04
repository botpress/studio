import { Alignment, AnchorButton, Button, InputGroup, Tooltip } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import React from 'react'

import style from './style.scss'

export function PatInput(props: {
  pat: string
  valid: boolean
  loading?: boolean
  onChange: (pat: string) => void
  onSave: () => void
}): JSX.Element {
  const { pat, valid, loading, onChange, onSave } = props

  return (
    <div>
      <div className={style.patContainer}>
        <InputGroup
          className={style.patInput}
          placeholder={lang.tr('topNav.deploy.enterPersonalAccessToken')}
          value={pat}
          onChange={(e) => onChange(e.target.value)}
          rightElement={
            valid ? (
              <Button disabled={true} icon={'tick-circle'} minimal={true} />
            ) : (
              <Tooltip
                content={loading ? lang.tr('topNav.deploy.checkingTokenStatus') : lang.tr('topNav.deploy.tokenInvalid')}
              >
                <Button disabled={true} icon={loading ? 'refresh' : 'error'} minimal={true} />
              </Tooltip>
            )
          }
        />
        <Button disabled={!valid} text={lang.tr('topNav.deploy.save')} onClick={onSave} />
      </div>
      <div style={{ marginTop: '10px' }}>
        <AnchorButton
          style={{ fontSize: 'small', paddingLeft: 0 }}
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
