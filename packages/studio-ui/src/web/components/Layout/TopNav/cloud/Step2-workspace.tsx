import { Button, Intent, MenuItem } from '@blueprintjs/core'
import { Select } from '@blueprintjs/select'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { RootReducer } from '~/reducers'
import style from './style.scss'
import { Workspace } from './types'

interface OwnProps {
  pat: string
  onCompleted: (selectedWorkspaceId: string) => void
}

type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = typeof mapDispatchToProps
type Props = DispatchProps & StateProps & OwnProps

const WorkspaceSelect = Select.ofType<Workspace>()

const WorkspaceSelector = (props: Props): JSX.Element => {
  const { bot, pat, onCompleted } = props

  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null)

  useEffect(() => {
    const ac = new AbortController()

    const fetchWorkspaces = async () => {
      const { data: workspaces } = await axios.get(`${window.CLOUD_CONTROLLER_ENDPOINT}/v1/workspaces`, {
        signal: ac.signal,
        headers: { Authorization: `bearer ${pat}` }
      })
      setWorkspaces(workspaces)
      if (workspaces.length > 0) {
        setSelectedWorkspace(workspaces[0])
      }
    }

    void fetchWorkspaces()
    return () => ac.abort()
  }, [pat])

  if (bot.cloud?.workspaceId) {
    onCompleted(bot.cloud.workspaceId)
    return <></>
  }

  if (!selectedWorkspace) {
    return <></>
  }

  return (
    <div className={style.wsContainer} onClick={(e) => e.stopPropagation()}>
      <WorkspaceSelect
        items={workspaces}
        filterable={false}
        itemRenderer={(item) => <MenuItem key={item.id} text={item.name} />}
        popoverProps={{ minimal: true }}
        onItemSelect={(ws) => {
          setSelectedWorkspace(ws)
        }}
      >
        <Button rightIcon="caret-down">{selectedWorkspace ? selectedWorkspace.name : 'Select workspace'}</Button>
      </WorkspaceSelect>
      <Button
        disabled={!selectedWorkspace.id}
        text="Deploy"
        onClick={() => {
          onCompleted(selectedWorkspace.id)
        }}
        intent={Intent.PRIMARY}
      />
    </div>
  )
}

const mapStateToProps = (state: RootReducer) => ({
  bot: state.bot
})

const mapDispatchToProps = {}

export default connect<StateProps, DispatchProps, OwnProps>(mapStateToProps, mapDispatchToProps)(WorkspaceSelector)
