import { ObjectCache } from 'common/object-cache'
import { TYPES } from 'core/app/types'
import { ContainerModule, interfaces } from 'inversify'

import { CacheInvalidators } from '.'
import { DiskStorageDriver } from './drivers/disk-driver'
import { GhostService } from './ghost-service'
import { MemoryObjectCache } from './memory-cache'

export const GhostContainerModule = new ContainerModule((bind: interfaces.Bind) => {
  bind<CacheInvalidators.FileChangedInvalidator>(TYPES.FileCacheInvalidator)
    .to(CacheInvalidators.FileChangedInvalidator)
    .inSingletonScope()

  bind<ObjectCache>(TYPES.ObjectCache)
    .to(MemoryObjectCache)
    .inSingletonScope()

  bind<DiskStorageDriver>(TYPES.DiskStorageDriver)
    .to(DiskStorageDriver)
    .inSingletonScope()

  bind<GhostService>(TYPES.GhostService)
    .to(GhostService)
    .inSingletonScope()
})
