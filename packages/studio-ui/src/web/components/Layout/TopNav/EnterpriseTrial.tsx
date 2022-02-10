import { Tooltip } from '@blueprintjs/core'
import React from 'react'
// import ToolTip from '~/components/Shared/ToolTip'
// import { lang } from '~/components/Shared/translations'
import style from './style.scss'

export default () => {
  return window.IS_PRO_ENABLED ? (
    <div />
  ) : (
    <Tooltip position="right-bottom" content="topNav.salesCallToActionDescription">
      <a className={style.cta_btn} target="_blank" href="https://botpress.com/request-trial-from-app">
        {/* 'topNav.salesCallToAction' */}
      </a>
    </Tooltip>
  )
}
