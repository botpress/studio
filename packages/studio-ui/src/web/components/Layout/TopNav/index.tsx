import { Button, Position } from '@blueprintjs/core'
import { ToolTip, utils } from 'botpress/shared'
import cx from 'classnames'
import React, { FC } from 'react'
import { RiLayoutLeftLine, RiLayoutRightLine, RiLayoutBottomLine } from 'react-icons/ri'
import { connect } from 'react-redux'
import { toggleBottomPanel } from '~/actions'

import { RootReducer } from '../../../reducers'
import EnterPriseTrial from './EnterpriseTrial'
import RightToolBar from './RightToolbar'

import style from './style.scss'

type Props = ReturnType<typeof mapStateToProps> & typeof mapDispatchToProps

// Notes
// 1- There this components regroups 3 magnificent ways of doing the same thing with different panels, will need a proper refactor and uniformization
// 2- There seems to be something in the ui reducer (toggleInspector action) that seems not to do anything, needs to be cleaned
// 3- The toggleLeftPanel handler is the worst, it seems
const Toolbar: FC<Props> = props => {
  // This should be moved this somewhere else, it seems to be all around the app
  const toggleRightPanel = () => {
    window.botpressWebChat.sendEvent({ type: 'toggle' })
  }

  const toggleLeftPanel = () => {
    window.toggleSidePanel()
  }

  // TODO add active / deactive state for each panel

  return (
    <nav className={style.topNav}>
      <EnterPriseTrial />
      <div className={style.layoutControls}>
        <ToolTip content={`${utils.shortControlKey} B toggle left pannel`} position={Position.BOTTOM}>
          <Button
            onClick={toggleLeftPanel}
            className={cx({ [style.active]: false })}
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
        <ToolTip content={`${utils.shortControlKey} E toggle Emulator`} position={Position.BOTTOM}>
          <Button
            onClick={toggleRightPanel}
            className={cx({ [style.active]: props.isEmulatorOpen })}
            icon={<RiLayoutRightLine size={17} />}
          />
        </ToolTip>
      </div>
      <RightToolBar />
    </nav>
  )
}

const mapStateToProps = (state: RootReducer) => ({
  botInfo: state.bot,
  docHints: state.ui.docHints,
  isEmulatorOpen: state.ui.emulatorOpen,
  isBottomPanelOpen: state.ui.bottomPanel
})

const mapDispatchToProps = {
  toggleBottomPanel
}

export default connect(mapStateToProps, mapDispatchToProps)(Toolbar)
