import React from 'react'
import { lang } from '~/components/shared/translations'

export default () => (
  <div className="panel panel-warning">
    <div className="panel-heading">{lang.tr('studio.flow.module.notFound')}</div>
    <div className="panel-body">
      <h4>{lang.tr('studio.flow.module.notProperlyRegistered')}</h4>
      <p>{lang.tr('studio.flow.module.tryingToLoad')}</p>
      {err && <p>{err}</p>}
      <p>
        {/* TODO update doc & help */}
        <a role="button" className="btn btn-primary btn-lg">
          {lang.tr('studio.flow.module.learnMore')}
        </a>
      </p>
    </div>
  </div>
)
