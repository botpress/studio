import { Button, Position } from '@blueprintjs/core'
import { ToolTip, utils } from 'botpress/shared'
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
        <ToolTip content={`${utils.shortControlKey} B toggle left pannel`} position={Position.BOTTOM}>
          <Button
            onClick={props.toggleExplorer}
            className={cx({ [style.active]: props.explorerOpen })}
            icon={<RiLayoutLeftLine size={17} />}
          />
        </ToolTip>
        <ToolTip content={`${utils.shortControlKey} J toggle bottom pannel`} position={Position.BOTTOM}>
          <Button
            onClick={props.toggleBottomPanel}
            className={cx({ [style.active]: props.isBottomPanelOpen })}
            icon={<RiLayoutBottomLine size={17} />}
          />
        </ToolTip>
        {window.IS_BOT_MOUNTED && (
          <ToolTip content={`${utils.shortControlKey} E toggle Emulator`} position={Position.BOTTOM}>
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
