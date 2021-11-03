import { Icon, Tooltip } from '@blueprintjs/core'
import { lang, ShortcutLabel } from 'botpress/shared'
import classNames from 'classnames'
import React, { FC, Fragment, useState } from 'react'
import { connect } from 'react-redux'
import { AccessControl, Downloader } from '~/components/Shared/Utils'

import { RootReducer } from '../../../reducers'

import style from './style.scss'

interface OwnProps {
  isEmulatorOpen: boolean
  hasDoc: boolean
  toggleDocs: () => void
  toggleBottomPanel: () => void
  onToggleEmulator: () => void
}

type StateProps = ReturnType<typeof mapStateToProps>

type Props = StateProps & OwnProps

const Toolbar: FC<Props> = props => {
  const [archiveUrl, setArchiveUrl] = useState('')
  const [archiveName, setArchiveName] = useState('')
  const { toggleDocs, hasDoc, onToggleEmulator, isEmulatorOpen, toggleBottomPanel } = props

  const exportBot = () => {
    setArchiveUrl(`/api/v1/studio/${window.BOT_ID}/export`)
    setArchiveName(`bot_${window.BOT_ID}_${Date.now()}.tgz`)
  }

  const pushRuntime = () => {
    console.log('run')
  }

  return (
    <header className={style.toolbar}>
      <Downloader url={archiveUrl} filename={archiveName} />
      <div className={style.list}>
        {!!hasDoc && (
          <Fragment>
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
          </Fragment>
        )}

        <button className={style.item} id="toggle-bot-archive" onClick={exportBot}>
          <Icon color="#1a1e22" icon="archive" iconSize={16} />
          <span className={style.label}>{lang.tr('Export archive')}</span>
        </button>

        {window.MESSAGING_ENDPOINT && (
          <button className={style.item} id="toggle-bot-archive" onClick={pushRuntime}>
            <Icon color="#1a1e22" icon="export" iconSize={16} />
            <span className={style.label}>{lang.tr('Push to runtime')}</span>
          </button>
        )}

        <AccessControl resource="bot.logs" operation="read">
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
        {window.MESSAGING_ENDPOINT && (
          <Tooltip content={<ShortcutLabel light shortcut="emulator-focus" />}>
            <button
              className={classNames(style.item, style.itemSpacing, { [style.active]: isEmulatorOpen })}
              onClick={onToggleEmulator}
              id="statusbar_emulator"
            >
              <Icon color="#1a1e22" icon="chat" iconSize={16} />
              <span className={style.label}>{lang.tr('toolbar.emulator')}</span>
            </button>
          </Tooltip>
        )}
      </div>
    </header>
  )
}

const mapStateToProps = (state: RootReducer) => ({
  user: state.user,
  botInfo: state.bot,
  docHints: state.ui.docHints
})

export default connect(mapStateToProps)(Toolbar)
