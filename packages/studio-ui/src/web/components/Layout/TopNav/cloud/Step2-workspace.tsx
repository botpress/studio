import { Button } from '@blueprintjs/core'
import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { RootReducer } from '~/reducers'

interface OwnProps {
  onCompleted: (selectedWorkspaceId: string) => void
}

type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = typeof mapDispatchToProps
type Props = DispatchProps & StateProps & OwnProps

const WorkspaceSelector = (props: Props): JSX.Element => {
  const { bot, personalAccessToken, onCompleted } = props

  const [workspaces, setWorkspaces] = useState([])
  const [selectedWorkspace, setSelectedWorkspace] = useState(null)

  useEffect(() => {
    const fetchWorkspaces = async () => {
      const { data: workspaces } = await axios.get(`${window.CLOUD_CONTROLLER_ENDPOINT}/v1/workspaces`, {
        headers: { Authorization: `bearer ${personalAccessToken}` }
      })
      setWorkspaces(workspaces)
      if (workspaces.length > 0) {
        setSelectedWorkspace(workspaces[0])
      }
    }

    void fetchWorkspaces()
  }, [personalAccessToken])

  if (bot.cloud?.workspaceId) {
    onCompleted(bot.cloud.workspaceId)
    return <></>
  }

  return (
    <div>
      <select onChange={(e) => setSelectedWorkspace(workspaces.find((w) => w.id === e.target.value))}>
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
  personalAccessToken: state.user.personalAccessToken,
  bot: state.bot
})

const mapDispatchToProps = {}

export default connect<StateProps, DispatchProps, OwnProps>(mapStateToProps, mapDispatchToProps)(WorkspaceSelector)
