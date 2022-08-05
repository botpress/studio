import VError from 'verror'

type Brand<K, T> = K & { __brand: T }

// export type CreateBotError = Brand<VError, 'bleh'>
export type CDMConflictError = Brand<VError, 'bleh'>

// type CreateBotError = Brand<typeof VError, 'CreateBotError'>
// type VError = typeof VError

// export class CreateBotError extends VError implements Brand<typeof VError, 'create_bot_error'> {
//   // @ts-ignore
//   // private __brand: undefined
// }

// export class CDMConflictError extends VError {
//   // @ts-ignore
//   private __brand: undefined
// }

interface Bleh {
  a: number
}

type B = Omit<Bleh, 'a'>

export class UnexpectedError extends VError {
  // @ts-ignore
  private __brand: undefined
}

export class RuntimeNotActiveError extends VError {
  constructor(public cloudBotId: string, public runtimeStatus: string) {
    super(`runtime for bot ${cloudBotId} is ${runtimeStatus}`)
  }
}
