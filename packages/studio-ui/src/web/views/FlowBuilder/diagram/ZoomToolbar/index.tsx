import { Button } from '@blueprintjs/core'
import { lang, ToolTip } from 'botpress/shared'
import React, { FC } from 'react'
import { connect } from 'react-redux'
import { zoomIn, zoomOut, zoomToLevel, zoomToFit } from '~/actions'

import { RootReducer } from '../../../../reducers'

import style from './style.scss'

type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = typeof mapDispatchToProps

type Props = DispatchProps & StateProps

const ZoomToolbar: FC<Props> = ({ zoomLevel, zoomIn, zoomOut, zoomToLevel, zoomToFit }) => (
  <div className={style.zoomWrapper}>
    <ToolTip content={lang.tr('studio.flow.zoomOut')}>
      <Button icon="zoom-out" disabled={zoomLevel <= 10} onClick={zoomOut} />
    </ToolTip>
    <label>
      <span className={style.label}>{zoomLevel}%</span>
      <select value={zoomLevel} onChange={({ currentTarget: { value } }) => zoomToLevel(Number.parseInt(value))}>
        <option value={25}>25%</option>
        <option value={50}>50%</option>
        <option value={75}>75%</option>
        <option value={100}>100%</option>
        <option value={150}>150%</option>
        <option value={200}>200%</option>
      </select>
    </label>
    <ToolTip content={lang.tr('studio.flow.zoomIn')}>
      <Button icon="zoom-in" onClick={zoomIn} />
    </ToolTip>
    <ToolTip content={lang.tr('studio.flow.zoomToFit')}>
      <Button className={style.zoomToFit} icon="zoom-to-fit" onClick={zoomToFit} />
    </ToolTip>
  </div>
)

const mapStateToProps = (state: RootReducer) => ({
  zoomLevel: state.ui.zoomLevel
})

const mapDispatchToProps = {
  zoomIn,
  zoomOut,
  zoomToFit,
  zoomToLevel
}

export default connect<StateProps, DispatchProps>(mapStateToProps, mapDispatchToProps)(ZoomToolbar)
