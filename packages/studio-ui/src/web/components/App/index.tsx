import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import { fetchBotInformation, refreshHints } from '~/actions'
import EventBus from '~/util/EventBus'

import routes, { history } from '../Routes'

interface Props {
  refreshHints: () => void
  fetchBotInformation: () => void
}

class App extends Component<Props> {
  fetchData = () => {
    this.props.fetchBotInformation()

    if (window.IS_BOT_MOUNTED) {
      this.props.refreshHints()
    }
  }

  // Prevents re-rendering the whole layout when the user changes. Fixes a bunch of warnings & double queries
  shouldComponentUpdate() {
    return false
  }

  componentDidMount() {
    const appName = window.APP_NAME || 'Botpress Studio'
    const botName = window.BOT_NAME ? ` – ${window.BOT_NAME}` : ''
    window.document.title = `${appName}${botName}`

    if (window.APP_FAVICON) {
      const link = document.querySelector('link[rel="icon"]')
      link.setAttribute('href', window.APP_FAVICON)
    }

    if (window.APP_CUSTOM_CSS) {
      const sheet = document.createElement('link')
      sheet.rel = 'stylesheet'
      sheet.href = window.APP_CUSTOM_CSS
      sheet.type = 'text/css'
      document.head.appendChild(sheet)
    }

    EventBus.default.setup()

    // This acts as the app lifecycle management.
    // If this grows too much, move to a dedicated lifecycle manager.
    this.fetchData()

    EventBus.default.on('hints.updated', () => {
      this.props.refreshHints()
    })

    window.addEventListener('message', e => {
      if (!e.data || !e.data.action) {
        return
      }

      const { action, payload } = e.data
      if (action === 'navigate-url') {
        history.push(payload)
      }
    })
  }

  render() {
    return <Fragment>{routes()}</Fragment>
  }
}

const mapDispatchToProps = {
  fetchBotInformation,
  refreshHints
}

export default connect(undefined, mapDispatchToProps)(App)
