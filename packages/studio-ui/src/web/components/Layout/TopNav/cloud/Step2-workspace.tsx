import { Button } from '@blueprintjs/core'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { RootReducer } from '~/reducers'
import { Workspace } from './types'

interface OwnProps {
  pat: string
  onCompleted: (selectedWorkspaceId: string) => void
}

type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = typeof mapDispatchToProps
type Props = DispatchProps & StateProps & OwnProps

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
    <div>
      <select
        onChange={(e) => {
          const matchingWorkspace = workspaces.find((w) => w.id === e.target.value)
          if (matchingWorkspace) {
            setSelectedWorkspace(matchingWorkspace)
          }
        }}
      >
        {workspaces.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name}
          </option>
        ))}
      </select>
      <Button
        disabled={!selectedWorkspace.id}
        text="Deploy to this workspace"
        onClick={() => onCompleted(selectedWorkspace.id)}
      />
    </div>
  )
}

const mapStateToProps = (state: RootReducer) => ({
  bot: state.bot
})

const mapDispatchToProps = {}

export default connect<StateProps, DispatchProps, OwnProps>(mapStateToProps, mapDispatchToProps)(WorkspaceSelector)