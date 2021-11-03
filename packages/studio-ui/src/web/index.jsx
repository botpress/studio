import '@blueprintjs/core/lib/css/blueprint.css'
import 'babel-polyfill'
import React from 'expose-loader?React!react'
import ReactDOM from 'expose-loader?ReactDOM!react-dom'
import { HotKeys } from 'react-hotkeys'
import { Provider } from 'react-redux'

// Required to fix outline issue
import './style.scss'
/* eslint-disable */
import 'expose-loader?ReactSelect!react-select'
import 'expose-loader?PropTypes!prop-types'
import 'expose-loader?ReactBootstrap!react-bootstrap'
import 'expose-loader?Reactstrap!reactstrap' // TODO Remove me once we migrated to blueprint
import 'expose-loader?BlueprintJsCore!@blueprintjs/core'
import 'expose-loader?BlueprintJsSelect!@blueprintjs/select'
import 'expose-loader?BotpressShared!ui-shared'
import 'expose-loader?BotpressContentTypePicker!~/components/Content/Select'
import 'expose-loader?BotpressContentPicker!~/components/Content/Select/Widget'
import 'expose-loader?SmartInput!~/components/SmartInput'
import 'expose-loader?ElementsList!~/components/Shared/ElementsList'
import 'expose-loader?SelectActionDropdown!~/views/FlowBuilder/nodeProps/SelectActionDropdown'
import 'expose-loader?BotpressTooltip!~/components/Shared/Tooltip'
import 'expose-loader?BotpressUI!~/components/Shared/Interface'
import 'expose-loader?BotpressUtils!~/components/Shared/Utils'
import 'expose-loader?DocumentationProvider!~/components/Util/DocumentationProvider'
import { initializeTranslations } from './translations'
/* eslint-enable */
import { utils } from 'botpress/shared'
import store from './store'

import 'ui-shared/dist/theme.css'
require('bootstrap/dist/css/bootstrap.css')
require('storm-react-diagrams/dist/style.min.css')
require('./theme.scss')

if (!window.BOT_ID) {
  console.error(`This bot doesn't exist`)
} else {
  initializeTranslations()

  // Do not use "import App from ..." as hoisting will screw up styling
  const App = require('./components/App').default

  ReactDOM.render(
    <Provider store={store}>
      <HotKeys keyMap={utils.keyMap}>
        <App />
      </HotKeys>
    </Provider>,
    document.getElementById('app')
  )
}
