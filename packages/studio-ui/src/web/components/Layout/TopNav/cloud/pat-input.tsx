import { Alignment, AnchorButton, Button, InputGroup, Intent, Tooltip } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import React, { useState } from 'react'

import style from './style.scss'

export function PatInput(props: { error: boolean; disabled: boolean; onSave: (pat: string) => void }): JSX.Element {
  const { error, disabled, onSave } = props

  const [pat, setPat] = useState<string>('')

  return (
    <div>
      <div className={style.patContainer}>
        <InputGroup
          className={style.patInput}
          placeholder={lang.tr('topNav.deploy.enterPersonalAccessToken')}
          value={pat}
          onChange={(e) => setPat(e.target.value)}
          intent={error ? Intent.DANGER : undefined}
          rightElement={
            error ? (
              <Tooltip content={lang.tr('topNav.deploy.tokenInvalid')}>
                <Button disabled icon={'error'} minimal />
              </Tooltip>
            ) : undefined
          }
        />
        <Button disabled={disabled} text={lang.tr('topNav.deploy.save')} onClick={() => onSave(pat)} />
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
