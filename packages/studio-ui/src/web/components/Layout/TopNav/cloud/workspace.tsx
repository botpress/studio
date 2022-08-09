import { Button, Intent, MenuItem } from '@blueprintjs/core'
import { Select } from '@blueprintjs/select'
import { lang } from 'botpress/shared'
import { CDMWorkspace } from 'common/cloud-client'
import React, { useState } from 'react'
import style from './style.scss'

const WorkspaceSelect = Select.ofType<CDMWorkspace>()

export function WorkspaceSelector(props: {
  workspaces: CDMWorkspace[]
  onSaveClicked: (selectedWorkspace: CDMWorkspace) => void
}): JSX.Element {
  const { workspaces, onSaveClicked } = props

  if (workspaces.length === 0) {
    throw new Error('No workspaces found')
  }

  const [selectedWorkspace, setSelectedWorkspace] = useState<CDMWorkspace>(workspaces[0])

  return (
    <div className={style.wsContainer} onClick={(e) => e.stopPropagation()}>
      <WorkspaceSelect
        items={workspaces}
        filterable={false}
        itemRenderer={(item, { handleClick }) => <MenuItem key={item.id} text={item.name} onClick={handleClick} />}
        popoverProps={{ minimal: true }}
        onItemSelect={(ws) => {
          setSelectedWorkspace(ws)
        }}
      >
        <Button rightIcon="caret-down">{selectedWorkspace.name}</Button>
      </WorkspaceSelect>
      <Button
        disabled={selectedWorkspace === undefined}
        text={lang.tr('topNav.deploy.deploy')}
        onClick={() => onSaveClicked(selectedWorkspace)}
        intent={Intent.PRIMARY}
      />
    </div>
  )
}
