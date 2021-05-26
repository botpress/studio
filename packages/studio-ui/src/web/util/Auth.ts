import axios from 'axios'
import { auth } from 'botpress/shared'
import { CSRF_TOKEN_HEADER } from 'common/auth'
import { EventEmitter2 } from 'eventemitter2'

export const authEvents = new EventEmitter2()

export const setToken = (token: any): void => {
  auth.setToken(token)

  axios.defaults.headers.common[CSRF_TOKEN_HEADER] = token.csrf
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
  authEvents.emit('new_token')
}
