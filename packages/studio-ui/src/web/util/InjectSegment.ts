import hash from 'hash.js'

const extractUserHashFromUser = user => {
  if (!user || !user.email) {
    return false
  }
  return hash
    .sha256()
    .update('botpressUserEmail' + user.email)
    .digest('hex')
}

/** Original code from Segment, non-minified */
const originalInjectionCode = () => {
  // extract key to variable, this is the only change.
  const YOUR_WRITE_KEY = '7lxeXxbGysS04TvDNDOROQsFlrls9NoY'

  // Create a queue, but don't obliterate an existing one!
  var analytics = (window.analytics = window.analytics || [])
  // If the real analytics.js is already on the page return.
  if (analytics.initialize) return
  // If the snippet was invoked already show an error.
  if (analytics.invoked) {
    if (window.console && console.error) {
      console.error('Segment snippet included twice.')
    }
    return
  }
  // Invoked flag, to make sure the snippet
  // is never invoked twice.
  analytics.invoked = true
  // A list of the methods in Analytics.js to stub.
  analytics.methods = [
    'trackSubmit',
    'trackClick',
    'trackLink',
    'trackForm',
    'pageview',
    'identify',
    'reset',
    'group',
    'track',
    'ready',
    'alias',
    'debug',
    'page',
    'once',
    'off',
    'on',
    'addSourceMiddleware',
    'addIntegrationMiddleware',
    'setAnonymousId',
    'addDestinationMiddleware'
  ]
  // Define a factory to create stubs. These are placeholders
  // for methods in Analytics.js so that you never have to wait
  // for it to load to actually record data. The `method` is
  // stored as the first argument, so we can replay the data.
  analytics.factory = function(method) {
    return function() {
      var args = Array.prototype.slice.call(arguments)
      args.unshift(method)
      analytics.push(args)
      return analytics
    }
  }
  // For each of our methods, generate a queueing stub.
  for (var i = 0; i < analytics.methods.length; i++) {
    var key = analytics.methods[i]
    analytics[key] = analytics.factory(key)
  }
  // Define a method to load Analytics.js from our CDN,
  // and that will be sure to only ever load it once.
  analytics.load = function(key, options) {
    // Create an async script element based on your key.
    var script = document.createElement('script')
    script.type = 'text/javascript'
    script.async = true
    script.src = 'https://cdn.segment.com/analytics.js/v1/' + key + '/analytics.min.js'
    // Insert our script next to the first script element.
    var first = document.getElementsByTagName('script')[0]
    first.parentNode.insertBefore(script, first)
    analytics._loadOptions = options
  }
  analytics._writeKey = YOUR_WRITE_KEY
  // Add a version to keep track of what's in the wild.
  analytics.SNIPPET_VERSION = '4.13.2'
  // Load Analytics.js with your key, which will automatically
  // load the tools you've enabled for your account. Boosh!
  analytics.load(YOUR_WRITE_KEY)
  // Make the first page call to load the integrations. If
  // you'd like to manually name or tag the page, edit or
  // move this call however you'd like.
  analytics.page()
}

export default user => {
  const userEmailHash = extractUserHashFromUser(user)
  if (!userEmailHash) {
    return false
  }
  const accountLicenseHash = window.SAFE_LICENSE_HASH

  // this is the Segment integration
  originalInjectionCode()

  // now we check if it was loaded properly, and if so, add metadata.
  const analytics = window.analytics

  if (!analytics.identify) {
    return
  }

  const machineUUID = window.UUID

  /**
   * The aim of the identify function is to get an idea of how many people are 
   * using Botpress per license / machine. 
   * userId is unset so Segment will generate an anonymous one.
   */
  analytics.identify({
    accountLicenseHash,
    userEmailHash,
    machineUUID
  })
}
