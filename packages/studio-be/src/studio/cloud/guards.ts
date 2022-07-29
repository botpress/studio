import axios from 'axios'
import _ from 'lodash'
import { CDMError } from './types'

export const isCDMError = (e: any): e is CDMError => {
  return (
    axios.isAxiosError(e) &&
    e.response?.data !== undefined &&
    _.isObject(e.response?.data) &&
    _.isString(e.response.data['message'])
  )
}
