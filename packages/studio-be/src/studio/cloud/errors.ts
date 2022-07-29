import { VError } from 'verror'

export class CDMConflictError extends VError {
  // @ts-ignore
  private __brand: undefined
}

export class UnexpectedError extends VError {
  // @ts-ignore
  private __brand: undefined
}

export class UnreachableCaseError extends VError {
  constructor(val: never) {
    super(`Unreachable case: ${val}`)
  }
}
