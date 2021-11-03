import { BotService } from 'core/bots'
import { GhostContainerModule } from 'core/bpfs'
import { CMSService } from 'core/cms'
import { SkillService } from 'core/dialog'
import { DialogContainerModule } from 'core/dialog/dialog.inversify'
import { LocalJobService, JobService } from 'core/distributed'
import { MediaServiceProvider } from 'core/media'
import { MigrationService } from 'core/migration'
import { RealtimeService } from 'core/realtime'
import { ActionService, ActionServersService, HintsService } from 'core/user-code'
import { ContainerModule, interfaces } from 'inversify'
import { NLUService } from 'studio/nlu'
import { QNAService } from 'studio/qna'

import { TYPES } from '../types'

const ServicesContainerModule = new ContainerModule((bind: interfaces.Bind) => {
  bind<CMSService>(TYPES.CMSService)
    .to(CMSService)
    .inSingletonScope()

  bind<MediaServiceProvider>(TYPES.MediaServiceProvider)
    .to(MediaServiceProvider)
    .inSingletonScope()

  bind<ActionService>(TYPES.ActionService)
    .to(ActionService)
    .inSingletonScope()

  bind<ActionServersService>(TYPES.ActionServersService)
    .to(ActionServersService)
    .inSingletonScope()

  bind<JobService>(TYPES.JobService)
    .to(LocalJobService)
    .inSingletonScope()

  bind<HintsService>(TYPES.HintsService)
    .to(HintsService)
    .inSingletonScope()

  bind<SkillService>(TYPES.SkillService)
    .to(SkillService)
    .inSingletonScope()

  bind<BotService>(TYPES.BotService)
    .to(BotService)
    .inSingletonScope()

  bind<MigrationService>(TYPES.MigrationService)
    .to(MigrationService)
    .inSingletonScope()

  bind<NLUService>(TYPES.NLUService)
    .to(NLUService)
    .inSingletonScope()

  bind<QNAService>(TYPES.QnaService)
    .to(QNAService)
    .inSingletonScope()

  bind<RealtimeService>(TYPES.RealtimeService)
    .to(RealtimeService)
    .inSingletonScope()
})

export const ServicesContainerModules = [ServicesContainerModule, DialogContainerModule, GhostContainerModule]
