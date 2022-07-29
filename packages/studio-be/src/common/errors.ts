import { VError } from 'verror'

export class UnreachableCaseError extends VError {
  constructor(val: never) {
    super(`Unreachable case: ${val}`)
  }
}
