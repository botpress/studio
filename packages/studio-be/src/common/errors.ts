import axios, { AxiosError } from 'axios'
import _ from 'lodash'
import { VError } from 'verror'

export interface CDMError extends AxiosError<{ message: string }> {
  response: NonNullable<AxiosError<{ message: string }>['response']>
}

export const isCDMError = (e: any): e is CDMError => {
  return (
    axios.isAxiosError(e) &&
    e.response?.data !== undefined &&
    _.isObject(e.response?.data) &&
    _.isString(e.response.data['message'])
  )
}

export class UnreachableCaseError extends VError {
  constructor(val: never) {
    super(`Unreachable case: ${val}`)
  }
}
