import { Callout, Intent } from '@blueprintjs/core'
import React, { useContext } from 'react'
import { connect } from 'react-redux'
import { RootReducer } from '~/reducers'
import { FlowReducer } from '~/reducers/flows'
import { WidgetContext } from '../Content/Select/WidgetContext'
import { getContentItemUsage } from '../Shared/Utils'
import style from './style.scss'

/** Displays a warning to user if cms content used in multiple places */
export function ContentNotice({ flows, qnaUsage }: { flows: FlowReducer; qnaUsage: any }) {
  const { itemId } = useContext(WidgetContext)
  const usage = itemId ? getContentItemUsage(itemId, flows, qnaUsage) : []
  if (usage.length <= 1) {
    return null
  }
  return (
    <Callout className={style.contentNotice} title="Changing Shared Content" intent={Intent.PRIMARY} icon="info-sign">
      This content is used in {usage.length} places. Changing it will affect all places.
    </Callout>
  )
}

const mapStateToProps = (state: RootReducer) => ({
  flows: state.flows,
  qnaUsage: state.content.qnaUsage
})
export default connect(mapStateToProps)(ContentNotice)
