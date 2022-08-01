import { Alignment, AnchorButton, Button, Icon, InputGroup, Tooltip } from '@blueprintjs/core'

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
          placeholder="Enter Personal Access Token"
          value={pat}
          onChange={(e) => onChange(e.target.value)}
          rightElement={
            valid ? (
              <Button disabled={true} icon={'tick-circle'} minimal={true} />
            ) : (
              <Tooltip content={loading ? 'Checking token status' : 'Token invalid'}>
                <Button disabled={true} icon={loading ? 'refresh' : 'error'} minimal={true} />
              </Tooltip>
            )
          }
        />
        <Button disabled={!valid} text="Save" onClick={onSave} />
      </div>
      <div style={{ marginTop: '10px' }}>
        <AnchorButton
          style={{ fontSize: 'small', paddingLeft: 0 }}
          text="Create a Personal Access Token"
          small
          target="_blank"
          rightIcon="share"
          minimal
          href="http://127.0.0.1:9000/settings#pats"
          alignText={Alignment.LEFT}
        />
      </div>
    </div>
  )
}
