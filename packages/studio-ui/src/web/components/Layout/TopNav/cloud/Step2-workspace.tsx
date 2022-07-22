import { Button } from '@blueprintjs/core'
import axios from 'axios'
import React, { useEffect, useState } from 'react'

export const WorkspaceSelector = (props: {
  onCompleted: (selectedWorkspace: any) => {}
  personalAccessToken: string
}): JSX.Element => {
  const { personalAccessToken, onCompleted } = props

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
        disabled={!selectedWorkspace}
        text="Deploy to this workspace"
        onClick={() => onCompleted(selectedWorkspace)}
      />
    </div>
  )
}
