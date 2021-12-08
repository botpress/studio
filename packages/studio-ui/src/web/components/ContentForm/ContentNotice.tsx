import { Callout, Intent } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import React, { useContext } from 'react'
import { connect } from 'react-redux'
import { RootReducer } from '~/reducers'
import { FlowReducer } from '~/reducers/flows'
import { WidgetContext } from '../Content/Select/WidgetContext'
import { getContentItemUsage } from '../Shared/Utils'
import withLanguage from '../Util/withLanguage'

import style from './style.scss'

/** Displays a warning to user if cms content used in multiple places */
export function ContentNotice({ flows, qnaUsage }: { flows: FlowReducer; qnaUsage: any }) {
  const { itemId } = useContext(WidgetContext)
  const usage = itemId ? getContentItemUsage(itemId, flows, qnaUsage) : []
  if (usage.length <= 1) {
    return null
  }
  return (
    <Callout
      className={style.contentNotice}
      title={lang.tr('contentNotice.title')}
      intent={Intent.PRIMARY}
      icon="info-sign"
    >
      <p>{lang.tr('contentNotice.message', { count: usage.length })}</p>
    </Callout>
  )
}

const mapStateToProps = (state: RootReducer) => ({
  flows: state.flows,
  qnaUsage: state.content.qnaUsage
})
export default connect(mapStateToProps)(withLanguage(ContentNotice))
