import { lang } from 'botpress/shared'
import _ from 'lodash'
import React, { FC } from 'react'
import { connect } from 'react-redux'

import ConfigStatus from './ConfigStatus'
import LangSwitcher from './LangSwitcher'
import style from './style.scss'
import TrainingStatusComponent from './TrainingStatus'

interface Props {
  langSwitcherOpen: boolean
  user: any
  botInfo: any
  contentLang: string
  toggleLangSwitcher: (e: any) => void
}

const StatusBar: FC<Props> = (props) => {
  const isCloudBot = Boolean(props.botInfo?.cloud?.clientId)
  return (
    <footer className={style.statusBar}>
      <div className={style.item}>
        <span>{window.APP_VERSION}</span>
        <span className={style.botName}>{window.BOT_NAME}</span>
        {isCloudBot && <span>{lang.tr('statusBar.cloudEnabled')}</span>}
        <LangSwitcher toggleLangSwitcher={props.toggleLangSwitcher} langSwitcherOpen={props.langSwitcherOpen} />
      </div>
      <div className={style.item}>
        {props.user && props.user.isSuperAdmin && <ConfigStatus />}
        <TrainingStatusComponent currentLanguage={props.contentLang} />
      </div>
    </footer>
  )
}

const mapStateToProps = (state) => ({
  user: state.user,
  botInfo: state.bot,
  contentLang: state.language.contentLang
})

export default connect(mapStateToProps)(StatusBar)
