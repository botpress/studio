import { Button, Position } from '@blueprintjs/core'
import { ToolTip, utils } from 'botpress/shared'
import cx from 'classnames'
import React, { FC, useEffect } from 'react'
import { RiLayoutLeftLine, RiLayoutRightLine, RiLayoutBottomLine } from 'react-icons/ri'
import { connect } from 'react-redux'
import { toggleBottomPanel, toggleInspector } from '~/actions'

import { RootReducer } from '../../../reducers'
import EnterPriseTrial from './EnterpriseTrial'
import RightToolBar from './RightToolbar'

import style from './style.scss'

type Props = ReturnType<typeof mapStateToProps> & typeof mapDispatchToProps

const Toolbar: FC<Props> = props => {
  // TODO move this somewhere else, it seems to be all around the app
  const toggleRightPanel = () => {
    window.botpressWebChat.sendEvent({ type: 'toggle' })
  }

  // TODO add active / deactive state for each panel

  return (
    <nav className={style.topNav}>
      <EnterPriseTrial />
      <div className={style.layoutControls}>
        <ToolTip content={`${utils.shortControlKey} B toggle left pannel`} position={Position.BOTTOM}>
          <Button
            onClick={props.toggleLeftPanel}
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
  toggleBottomPanel,
  toggleLeftPanel: toggleInspector
}

export default connect(mapStateToProps, mapDispatchToProps)(Toolbar)
