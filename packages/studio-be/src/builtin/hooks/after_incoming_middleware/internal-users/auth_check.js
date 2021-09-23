/**
 * Refresh the authenticated state of the session based on the user attributes
 * Thus, session values should be considered reliable
 */
const moment = require('moment')
const { user, session } = event.state

if (user && session) {
  session.isAuthenticated = !!user.authenticatedUntil && moment(user.authenticatedUntil) > moment()
  session.isAuthorized = user.isAuthorized
}
