import { Tooltip } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import React from 'react'
import style from './style.scss'

export default () => {
  return window.IS_PRO_ENABLED ? (
    <span />
  ) : (
    <Tooltip position="right-bottom" content={lang.tr('studio.flow.toolbar.salesCallToActionDescription')}>
      <a className={style.cta_btn} target="_blank" href="https://botpress.com/request-trial-from-app">
        {lang.tr('studio.flow.toolbar.salesCallToAction')}
      </a>
    </Tooltip>
  )
}
