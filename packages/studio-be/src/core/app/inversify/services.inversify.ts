import { BotService } from 'core/bots'
import { GhostContainerModule } from 'core/bpfs'
import { CMSService } from 'core/cms'
import { SkillService } from 'core/dialog'
import { DialogContainerModule } from 'core/dialog/dialog.inversify'
import { LocalJobService, JobService, RedisJobService } from 'core/distributed'
import { KeyValueStore } from 'core/kvs'
import { MediaServiceProvider } from 'core/media'
import { MigrationService } from 'core/migration'
import { AuthService } from 'core/security'
import { ActionService, ActionServersService, HintsService } from 'core/user-code'
import { ContainerModule, interfaces } from 'inversify'
import { CloudService } from 'studio/cloud/cloud-service'
import { NLUService } from 'studio/nlu'
import { QNAService } from 'studio/qna'
import { TestingService } from 'studio/testing'

import { TYPES } from '../types'

const ServicesContainerModule = new ContainerModule((bind: interfaces.Bind) => {
  bind<CMSService>(TYPES.CMSService).to(CMSService).inSingletonScope()

  bind<MediaServiceProvider>(TYPES.MediaServiceProvider).to(MediaServiceProvider).inSingletonScope()

  bind<ActionService>(TYPES.ActionService).to(ActionService).inSingletonScope()

  bind<ActionServersService>(TYPES.ActionServersService).to(ActionServersService).inSingletonScope()

  bind<JobService>(TYPES.JobService)
    .to(LocalJobService)
    .inSingletonScope()
    .when(() => !process.CLUSTER_ENABLED || !process.IS_PRO_ENABLED)

  bind<JobService>(TYPES.JobService)
    .to(RedisJobService)
    .inSingletonScope()
    .when(() => process.CLUSTER_ENABLED && process.IS_PRO_ENABLED)

  bind<HintsService>(TYPES.HintsService).to(HintsService).inSingletonScope()

  bind<AuthService>(TYPES.AuthService).to(AuthService).inSingletonScope()

  bind<KeyValueStore>(TYPES.KeyValueStore).to(KeyValueStore).inSingletonScope()

  bind<SkillService>(TYPES.SkillService).to(SkillService).inSingletonScope()

  bind<BotService>(TYPES.BotService).to(BotService).inSingletonScope()

  bind<MigrationService>(TYPES.MigrationService).to(MigrationService).inSingletonScope()

  bind<NLUService>(TYPES.NLUService).to(NLUService).inSingletonScope()

  bind<QNAService>(TYPES.QnaService).to(QNAService).inSingletonScope()

  bind<TestingService>(TYPES.TestingService).to(TestingService).inSingletonScope()

  bind<CloudService>(TYPES.CloudService).to(CloudService).inSingletonScope()
})

export const ServicesContainerModules = [ServicesContainerModule, DialogContainerModule, GhostContainerModule]
