import { injectable } from 'inversify'

export interface JobService {
  broadcast<T>(fn: Function): Promise<Function>
}

@injectable()
export class LocalJobService implements JobService {
  async broadcast<T>(fn: Function): Promise<Function> {
    return fn
  }
}
