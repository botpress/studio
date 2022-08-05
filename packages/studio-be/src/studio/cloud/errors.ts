import { VError } from 'verror'

export class CreateBotError extends VError {
  // @ts-ignore
  private __brand: undefined
}

export class CDMConflictError extends VError {
  // @ts-ignore
  private __brand: undefined
}

export class UnexpectedError extends VError {
  // @ts-ignore
  private __brand: undefined
}

export class RuntimeNotActiveError extends VError {
  constructor(public cloudBotId: string, public runtimeStatus: string) {
    super(`runtime for bot ${cloudBotId} is ${runtimeStatus}`)
  }
}

// export class CloudError extends VError {
//   constructor(public )
// }
