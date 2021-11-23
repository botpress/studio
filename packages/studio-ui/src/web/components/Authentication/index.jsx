import { Classes, H5, Intent, Position, Toaster } from '@blueprintjs/core'
import axios from 'axios'
import { auth } from 'botpress/shared'
import _ from 'lodash'
import PropTypes from 'prop-types'
import qs from 'query-string'
import React from 'react'
import { withRouter } from 'react-router-dom'

import { authEvents, setToken } from '~/util/Auth'

const CHECK_AUTH_INTERVAL = 60 * 1000

const ensureAuthenticated = WrappedComponent => {
  class AuthenticationWrapper extends React.Component {
    static contextTypes = {
      router: PropTypes.object
    }

    state = {
      authorized: false
    }

    componentDidMount() {
      authEvents.on('logout', this.promptLogin)
      this.setupAuth()
      this.interceptUnauthorized = axios.interceptors.response.use(
        response => {
          return response
        },
        error => {
          if (error.response.status !== 401) {
            return Promise.reject(error)
          }
          if (error.response.config.url !== `${window.API_PATH}/admin/ping`) {
            this.checkAuth() // just to make sure
          }
          return Promise.reject(error)
        }
      )
    }

    componentWillUnmount() {
      authEvents.off('logout', this.promptLogin)
      clearInterval(this.checkInterval)
      axios.interceptors.response.eject(this.interceptUnauthorized)
    }

    explainAndLogUserOut = () => {
      const toastContent = (
        <div>
          <div>
            <H5 className={Classes.DARK}>You have been logged out</H5>
            <p>For security reasons, we have logged you out. Log back in to continue working.</p>
          </div>
        </div>
      )
      Toaster.create({ position: Position.TOP_RIGHT }).show({
        message: toastContent,
        intent: Intent.DANGER,
        timeout: 10000,
        onDismiss: () => {
          this.promptLogin()
        }
      })
    }

    promptLogin = () => {
      const urlToken = _.get(this.props, 'location.query.token')
      const pathname = this.context.router.history.location.pathname

      if (pathname !== '/login' && !urlToken) {
        this.context.router.history.push('/login?returnTo=' + pathname)
      }
      window.location.href = window.ROOT_PATH + '/admin'
      window.botpressWebChat && window.botpressWebChat.sendEvent({ type: 'hide' })
    }

    setupAuth() {
      if (this.state.authorized) {
        this.setState({ authorized: true })
        return
      }

      const urlToken = _.get(this.props, 'location.query.token')
      const params = JSON.parse(_.get(this.props, 'location.query.params') || '{}')

      if (urlToken) {
        setToken(urlToken)
        const newQuery = _.omit(this.props.location.query, ['token', 'botId', 'env', 'params'])
        this.context.router.history.replace(
          Object.assign({}, this.props.location, {
            search: qs.stringify(newQuery),
            query: newQuery,
            pathname: params.returnTo || this.props.location.pathname
          })
        )
      }

      const tokenStillValid = auth.isTokenValid()
      this.setState({ authorized: tokenStillValid })

      if (tokenStillValid) {
        this.checkAuth()
        this.checkInterval = setInterval(this.checkAuth, CHECK_AUTH_INTERVAL)
      } else {
        this.promptLogin()
      }
    }

    checkAuth = () => {
      axios.get(`${window.API_PATH}/admin/ping`).catch(err => {
        if (err.response.status === 401) {
          this.explainAndLogUserOut()
        }
      })
    }

    render() {
      return this.state.authorized === true ? <WrappedComponent {...this.props} /> : null
    }
  }

  return withRouter(AuthenticationWrapper)
}

export default ensureAuthenticated
