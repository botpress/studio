const moment = require('moment')

/**
 * This action handles the payload sent by the server once authentication is successful.
 * It also handle invite code logic.
 *
 * @title Authentication Validate
 * @category Authentication
 * @hidden true
 */
const authValidate = async () => {
  if (event.type === 'auth') {
    const { authenticatedUntil, isAuthorized, identity, inviteRequired } = event.payload

    user.identity = identity
    user.authenticatedUntil = authenticatedUntil
    user.isAuthorized = isAuthorized

    if (inviteRequired) {
      temp.inviteRequired = true
    }
  } else if (temp.inviteRequired) {
    temp.inviteInvalidCount = (temp.inviteInvalidCount || 0) + 1

    const workspaceId = await bp.workspaces.getBotWorkspaceId(event.botId)
    const { rolloutStrategy, allowedUsages, inviteCode } = await bp.workspaces.getWorkspaceRollout(workspaceId)

    if (allowedUsages === 0) {
      console.error(`Invite code ${inviteCode} has 0 usage left`)
      return
    }

    const isCodeValid = await bp.workspaces.consumeInviteCode(workspaceId, event.preview)

    if (isCodeValid) {
      if (rolloutStrategy === 'authenticated-invite') {
        const { email, strategy } = user.identity
        await bp.workspaces.addUserToWorkspace(email, strategy, workspaceId, { asChatUser: true })
      }

      user.isAuthorized = true
      temp.inviteRequired = false
    }
  }

  // The verification from user storage to session storage is done by the hook, but it is not called while processing these actions
  session.isAuthenticated = !!user.authenticatedUntil && moment(user.authenticatedUntil) > moment()
  session.isAuthorized = user.isAuthorized
}

return authValidate()
