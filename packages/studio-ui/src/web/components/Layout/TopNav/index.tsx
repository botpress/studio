import { Button, Position } from '@blueprintjs/core'
import { lang, ToolTip, utils } from 'botpress/shared'
import cx from 'classnames'
import React, { FC } from 'react'
import { RiLayoutLeftLine, RiLayoutRightLine, RiLayoutBottomLine } from 'react-icons/ri'
import { connect } from 'react-redux'
import { toggleBottomPanel, toggleExplorer } from '~/actions'

import { RootReducer } from '../../../reducers'
import EnterPriseTrial from './EnterpriseTrial'
import RightToolBar from './RightToolbar'

import style from './style.scss'

type Props = ReturnType<typeof mapStateToProps> & typeof mapDispatchToProps

const Toolbar: FC<Props> = props => {
  // We cannot use setEmulatorOpen as it's actually the state is actually controlled by the message passed from the iframe
  // Will need some refactor for the emulator
  // This should be moved this somewhere else, it seems to be all around the app
  const toggleEmulator = () => {
    window.botpressWebChat.sendEvent({ type: 'toggle' })
  }

  return (
    <nav className={style.topNav}>
      <EnterPriseTrial />
      <div className={style.layoutControls}>
        <ToolTip
          content={lang.tr('topNav.toggleExplorer', { shortcut: `${utils.shortControlKey} B` })}
          position={Position.BOTTOM}
        >
          <Button
            onClick={props.toggleExplorer}
            className={cx({ [style.active]: props.explorerOpen })}
            icon={<RiLayoutLeftLine size={17} />}
          />
        </ToolTip>
        <ToolTip
          content={lang.tr('topNav.toggleDebuger', { shortcut: `${utils.shortControlKey} J` })}
          position={Position.BOTTOM}
        >
          <Button
            onClick={props.toggleBottomPanel}
            className={cx({ [style.active]: props.isBottomPanelOpen })}
            icon={<RiLayoutBottomLine size={17} />}
          />
        </ToolTip>
        {window.IS_BOT_MOUNTED && (
          <ToolTip
            content={lang.tr('topNav.toggleEmulator', { shortcut: `${utils.shortControlKey} E` })}
            position={Position.BOTTOM}
          >
            <Button
              onClick={toggleEmulator}
              className={cx({ [style.active]: props.emulatorOpen })}
              icon={<RiLayoutRightLine size={17} />}
            />
          </ToolTip>
        )}
      </div>
      <RightToolBar />
    </nav>
  )
}

const mapStateToProps = (state: RootReducer) => ({
  botInfo: state.bot,
  docHints: state.ui.docHints,
  isBottomPanelOpen: state.ui.bottomPanel,
  emulatorOpen: state.ui.emulatorOpen,
  explorerOpen: state.ui.explorerOpen
})

const mapDispatchToProps = {
  toggleBottomPanel,
  toggleExplorer
}

export default connect(mapStateToProps, mapDispatchToProps)(Toolbar)
