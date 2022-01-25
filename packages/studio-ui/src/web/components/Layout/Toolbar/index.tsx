import { Button, Position } from '@blueprintjs/core'
import { ToolTip, utils } from 'botpress/shared'
import cx from 'classnames'
import React, { FC, useEffect } from 'react'
import { RiLayoutLeftLine, RiLayoutRightLine, RiLayoutBottomLine } from 'react-icons/ri'
import { connect } from 'react-redux'
import { toggleBottomPanel } from '~/actions'

import { RootReducer } from '../../../reducers'
import EnterPriseTrial from './EnterpriseTrial'
import RightToolBar from './RightToolbar'

import style from './style.scss'

type Props = ReturnType<typeof mapStateToProps> & typeof mapDispatchToProps

const Toolbar: FC<Props> = props => {
  // YOU ARE AT Toggling the emulator and toggling left panel  (on every page)

  // TODO move this somewhere else, it seems to be all around the app
  const toggleEmulator = () => {
    window.botpressWebChat.sendEvent({ type: 'toggle' })
  }

  useEffect(() => {
    console.log('bottom panel changes', props.isBottomPanelOpen)
  }, [props.isBottomPanelOpen])

  // TODO add active / deactive state for each panel

  return (
    <nav className={style.toolbar}>
      <EnterPriseTrial />
      <div className={style.layoutControls}>
        <ToolTip content={`${utils.shortControlKey} B toggle left pannel`} position={Position.BOTTOM}>
          <Button className={cx({ [style.active]: false })} icon={<RiLayoutLeftLine size={17} />} />
        </ToolTip>
        <ToolTip content={`${utils.shortControlKey} J toggle bottom pannel`} position={Position.BOTTOM}>
          <Button
            className={cx({ [style.active]: props.isBottomPanelOpen })}
            icon={<RiLayoutBottomLine size={17} />}
            onClick={props.toggleBottomPanel}
          />
        </ToolTip>
        <ToolTip content={`${utils.shortControlKey} E toggle Emulator`} position={Position.BOTTOM}>
          <Button
            className={cx({ [style.active]: props.isEmulatorOpen })}
            icon={<RiLayoutRightLine size={17} />}
            onClick={toggleEmulator}
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
