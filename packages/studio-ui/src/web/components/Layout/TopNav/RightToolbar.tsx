import { Icon, Tooltip } from '@blueprintjs/core'
import { lang, ShortcutLabel, utils } from 'botpress/shared'
import classNames from 'classnames'
import React, { FC } from 'react'
import { connect } from 'react-redux'
import { RootReducer } from '~/reducers'

import DeployCloudBtn from './DeployCloudBtn'
import style from './style.scss'

interface OwnProps {
  docHints: any[]
  isEmulatorOpen: boolean
}

type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = typeof mapDispatchToProps
type Props = DispatchProps & StateProps & OwnProps

const RightToolBar = (props: Props) => {
  const { docHints } = props
  const toggleEmulator = () => {
    window.botpressWebChat.sendEvent({ type: 'toggle' })
  }
  const toggleDocs = (e) => {
    e.preventDefault()

    if (docHints.length) {
      window.open(`https://botpress.com/docs/${docHints[0]}`, '_blank')
    }
  }

  return (
    <div>
      {docHints.length > 0 && (
        <>
          <Tooltip
            content={
              <div className={style.tooltip}>
                {lang.tr('topNav.help')}
                <div className={style.shortcutLabel}>
                  <ShortcutLabel light shortcut="docs-toggle" />
                </div>
              </div>
            }
          >
            <button className={style.item} onClick={toggleDocs}>
              <Icon color="#1a1e22" icon="help" iconSize={16} />
            </button>
          </Tooltip>
          <span className={style.divider}></span>
        </>
      )}
      <DeployCloudBtn />
      {window.IS_BOT_MOUNTED && (
        <Tooltip content={lang.tr('topNav.toggleEmulator', { shortcut: `${utils.shortControlKey} E` })}>
          <button
            className={classNames(style.item, style.itemSpacing, { [style.active]: props.isEmulatorOpen })}
            onClick={toggleEmulator}
            id="statusbar_emulator"
          >
            <Icon color="#1a1e22" icon="chat" iconSize={16} />
            <span className={style.label}>{lang.tr('topNav.emulator')}</span>
          </button>
        </Tooltip>
      )}
    </div>
  )
}

const mapStateToProps = (state: RootReducer) => ({
  docHints: state.ui.docHints,
  emulatorOpen: state.ui.emulatorOpen
})

const mapDispatchToProps = {}

export default connect<StateProps, DispatchProps, OwnProps>(mapStateToProps)(RightToolBar)
