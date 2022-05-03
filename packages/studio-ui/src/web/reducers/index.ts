import { BotConfig, ModuleDefinition } from 'botpress/sdk'
import { combineReducers } from 'redux'

import bot from './bot'
import bots, { BotsReducer } from './bots'
import components, { ComponentReducer } from './components'
import content, { ContentReducer } from './content'
import flows, { FlowReducer } from './flows'
import hints from './hints'
import language, { LanguageReducer } from './language'
import modules from './modules'
import ndu, { NduReducer } from './ndu'
import nlu, { NLUReducer } from './nlu'
import skills, { SkillsReducer } from './skills'
import spinner, { LoaderReducer } from './spinner'
import ui, { UiReducer } from './ui'
import user, { UserReducer } from './user'
export * from './selectors'

const bpApp = combineReducers({
  bots,
  content,
  flows,
  ui,
  user,
  bot,
  modules,
  skills,
  language,
  hints,
  ndu,
  nlu,
  components,
  spinner
})
export default bpApp

export interface RootReducer {
  flows: FlowReducer
  user: UserReducer
  content: ContentReducer
  skills: SkillsReducer
  components: ComponentReducer
  ndu: NduReducer
  modules: ModuleDefinition[]
  ui: UiReducer
  bot: BotConfig
  bots: BotsReducer
  nlu: NLUReducer
  language: LanguageReducer
  spinner: LoaderReducer
}
