/**
 * Logs out a connected chat user
 *
 * @title Logout user
 * @category Authentication
 * @author Botpress, Inc.
 */
const authLogout = async () => {
  user.authenticatedUntil = undefined
  user.isAuthorized = undefined

  session.isAuthorized = undefined
  session.isAuthenticated = undefined
}

return authLogout()
