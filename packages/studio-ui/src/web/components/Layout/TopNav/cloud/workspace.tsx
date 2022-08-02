import { Button, Intent, MenuItem } from '@blueprintjs/core'
import { Select } from '@blueprintjs/select'
import React, { useState } from 'react'
import style from './style.scss'
import { Workspace } from './types'

const WorkspaceSelect = Select.ofType<Workspace>()

export function WorkspaceSelector(props: {
  workspaces: Workspace[]
  onSaveClicked: (selectedWorkspace: Workspace) => void
}): JSX.Element {
  const { workspaces, onSaveClicked } = props

  if (workspaces.length === 0) {
    throw new Error('No workspaces found')
  }

  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace>(workspaces[0])

  return (
    <div className={style.wsContainer} onClick={(e) => e.stopPropagation()}>
      <WorkspaceSelect
        items={workspaces}
        filterable={false}
        itemRenderer={(item) => <MenuItem key={item.id} text={item.name} />}
        popoverProps={{ minimal: true }}
        onItemSelect={setSelectedWorkspace}
      >
        <Button rightIcon="caret-down">{selectedWorkspace.name}</Button>
      </WorkspaceSelect>
      <Button
        disabled={selectedWorkspace === undefined}
        text="Deploy"
        onClick={() => onSaveClicked(selectedWorkspace)}
        intent={Intent.PRIMARY}
      />
    </div>
  )
}
