import { Icon, Tooltip } from '@blueprintjs/core'
import { lang, ShortcutLabel } from 'botpress/shared'
import classNames from 'classnames'
import React, { FC } from 'react'
import { connect } from 'react-redux'
import { RootReducer } from '~/reducers'

import style from './style.scss'

interface Props {
  docHints: any[]
  isEmulatorOpen: boolean
}

const RightToolBar: FC<Props> = props => {
  const toggleEmulator = () => {
    window.botpressWebChat.sendEvent({ type: 'toggle' })
  }
  const toggleDocs = e => {
    e.preventDefault()

    if (props.docHints.length) {
      window.open(`https://botpress.com/docs/${props.docHints[0]}`, '_blank')
    }
  }

  return (
    <div>
      {props.docHints.length > 0 && (
        <>
          <Tooltip
            content={
              <div className={style.tooltip}>
                {lang.tr('toolbar.help')}
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

      {window.IS_BOT_MOUNTED && (
        <Tooltip content={<ShortcutLabel light shortcut="emulator-focus" />}>
          <button
            className={classNames(style.item, style.itemSpacing, { [style.active]: props.isEmulatorOpen })}
            onClick={toggleEmulator}
            id="statusbar_emulator"
          >
            <Icon color="#1a1e22" icon="chat" iconSize={16} />
            <span className={style.label}>{lang.tr('toolbar.emulator')}</span>
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

export default connect(mapStateToProps)(RightToolBar)

/**
 *     <AccessControl resource="bot.logs" operation="read">
      <Tooltip
        content={
          <div className={style.tooltip}>
            {lang.tr('toolbar.bottomPanel')}
            <div className={style.shortcutLabel}>
              <ShortcutLabel light shortcut="bottom-bar" />
            </div>
          </div>
        }
      >
        <button className={style.item} id="toggle-bottom-panel" onClick={toggleBottomPanel}>
          <Icon color="#1a1e22" icon="console" iconSize={16} />
        </button>
      </Tooltip>
    </AccessControl>
 */
