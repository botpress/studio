/**
 * This is the "gate" which is executed after any validation (after login, after invite, etc.)
 * It handles base logic for all rollout strategies.
 *
 * @title Authentication Gate
 * @category Authentication
 * @hidden true
 */
const authGate = async () => {
  const workspaceId = await bp.workspaces.getBotWorkspaceId(event.botId)
  const { rolloutStrategy: strategy } = await bp.workspaces.getWorkspaceRollout(workspaceId)

  temp.authorized = false
  temp.gatePromptCount = (temp.gatePromptCount || 0) + 1

  if (strategy === 'anonymous') {
    temp.authorized = true
  }

  if (strategy === 'anonymous-invite') {
    if (session.isAuthorized) {
      temp.authorized = true
    } else {
      temp.inviteRequired = true
    }
  }

  if (
    (strategy === 'authenticated' || strategy === 'authenticated-invite' || strategy === 'authorized') &&
    session.isAuthenticated &&
    session.isAuthorized
  ) {
    temp.authorized = true
  }
}

return authGate()
