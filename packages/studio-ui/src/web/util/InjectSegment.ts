import segmentPlugin from '@analytics/segment'
import Analytics from 'analytics'
import hash from 'hash.js'

// segment app name and write key
const APP_NAME = 'STUDIO_ANALYTICS'
const WRITE_KEY = '7lxeXxbGysS04TvDNDOROQsFlrls9NoY'

const extractUserHashFromUser = user => {
  if (!user || !user.email) {
    return false
  }
  return hash
    .sha256()
    .update('botpressUserEmail' + user.email)
    .digest('hex')
}

const intializeAnalytics = () => {
  const analytics = Analytics({
    app: APP_NAME,
    plugins: [
      segmentPlugin({
        writeKey: WRITE_KEY
      })
    ]
  })

  void analytics.page()

  return analytics
}

export default user => {
  const userEmailHash = extractUserHashFromUser(user)
  if (!userEmailHash) {
    return false
  }

  // this is the Segment integration
  const analytics = intializeAnalytics()

  const machineUUID = window.UUID

  /**
   * The aim of the identify function is to get an idea of how many people are
   * using Botpress per machine.
   * userId is unset so Segment will generate an anonymous one.
   */
  void analytics.identify(null, {
    userEmailHash,
    machineUUID
  })
}
