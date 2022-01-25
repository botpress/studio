import { ModelEntryRepository } from './model-entry-repo'
import { ModelEntry, ModelKey } from './typings'

const status = 'ready'

/**
 * Maps a pair [botId, lang] to [modelId, defHash] once training is done
 */
export class ModelEntryService {
  constructor(private _modelStateRepo: ModelEntryRepository) {}

  public async get(key: ModelKey): Promise<ModelEntry | undefined> {
    return this._modelStateRepo.get({ ...key, status })
  }

  public async set(model: ModelEntry) {
    return this._modelStateRepo.set({ ...model, status })
  }

  public async has(key: ModelEntry): Promise<boolean> {
    return this._modelStateRepo.has({ ...key, status })
  }

  public async del(key: ModelKey): Promise<void> {
    return this._modelStateRepo.del({ ...key, status })
  }

  public async query(query: Partial<ModelEntry>): Promise<ModelEntry[]> {
    return this._modelStateRepo.query({ ...query, status })
  }
}
