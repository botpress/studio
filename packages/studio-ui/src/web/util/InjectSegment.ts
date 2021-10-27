import segmentPlugin from '@analytics/segment'
import Analytics from 'analytics'
import hash from 'hash.js'
import { UserReducer } from '~/reducers/user'

const APP_NAME = 'STUDIO_ANALYTICS' // for reference, in case of second account
const WRITE_KEY = '7lxeXxbGysS04TvDNDOROQsFlrls9NoY' // taken from Segment UI

const extractUserHashFromUser = (user: UserReducer): string | undefined => {
  if (user?.email) {
    return hash
      .sha256()
      .update('botpressUserEmail' + user.email)
      .digest('hex')
  }
}

const initSegmentAnalytics = () => {
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

export default (user: UserReducer): void => {
  const userEmailHash = extractUserHashFromUser(user)
  if (!userEmailHash) {
    return
  }

  const analytics = initSegmentAnalytics()

  /**
   * The aim of the identify function is to get an idea of how many people are
   * using Botpress per machine.
   * userId is unset so Segment will generate an anonymous one.
   */
  void analytics.identify(null, {
    userEmailHash,
    machineUUID: window.UUID
  })
}
