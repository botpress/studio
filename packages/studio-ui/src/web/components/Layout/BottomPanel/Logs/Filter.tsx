import { Button, Intent } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import cx from 'classnames'
import React from 'react'
import CheckboxTree from 'react-checkbox-tree'
import 'react-checkbox-tree/lib/react-checkbox-tree.css'
import {
  FaCheckSquare,
  FaChevronDown,
  FaChevronRight,
  FaFile,
  FaFolder,
  FaFolderOpen,
  FaMinusSquare,
  FaPlusSquare,
  FaSquare
} from 'react-icons/fa'

import style from '../style.scss'

interface Props {
  setLogFilter: (checked: string[]) => any
  ref?: any
}

interface State {
  nodes: any
  checked: any
  expanded: any
}

export const LOG_FILTER_STORAGE_KEY = 'logsFilter'
export const LOG_FILTER_DEFAULT_VALUE = [
  'severity',
  'debug',
  'info',
  'warn',
  'error',
  'critical',
  'botLevel',
  'global',
  'currentBot'
]

export default class Debug extends React.Component<Props, State> {
  state = {
    nodes: undefined,
    checked: undefined,
    expanded: ['severity', 'botLevel']
  }

  async componentDidMount() {
    await this.loadConfiguration()
  }

  loadConfiguration = async () => {
    let logFilter = LOG_FILTER_DEFAULT_VALUE
    try {
      const logFilterString = localStorage.getItem('logsFilter')
      const persistedLogFilter = JSON.parse(logFilterString)

      if (logFilterString?.length && Array.isArray(persistedLogFilter)) {
        logFilter = persistedLogFilter
      }
    } catch (e) {}

    this.setState({
      nodes: [
        {
          value: 'severity',
          label: 'Severity',
          children: [
            { value: 'debug', label: 'Debug' },
            { value: 'info', label: 'Info' },
            { value: 'warn', label: 'Warning' },
            { value: 'error', label: 'Error' },
            { value: 'critical', label: 'Critical' }
          ]
        },
        {
          value: 'botLevel',
          label: 'Bot Level',
          children: [
            { value: 'global', label: 'Global' },
            { value: 'currentBot', label: 'Current Bot' }
          ]
        }
      ],
      checked: logFilter
    })

    this.props.setLogFilter(logFilter)
  }

  saveConfiguration = async () => {
    localStorage.setItem(LOG_FILTER_STORAGE_KEY, JSON.stringify(this.state.checked))
    this.props.setLogFilter(this.state.checked)
  }

  render() {
    if (!this.state.nodes) {
      return null
    }

    return (
      <div className={cx(style.tabContainer, style.flex)}>
        <div className={style.fullWidth}>
          <CheckboxTree
            nodes={this.state.nodes || []}
            checked={this.state.checked}
            checkModel={'all'}
            expanded={this.state.expanded}
            onCheck={(checked) => this.setState({ checked })}
            icons={{
              check: <FaCheckSquare />,
              uncheck: <FaSquare />,
              halfCheck: <FaCheckSquare fillOpacity="0.5" />,
              expandClose: <FaChevronRight />,
              expandOpen: <FaChevronDown />,
              expandAll: <FaPlusSquare />,
              collapseAll: <FaMinusSquare />,
              parentClose: <FaFolder stroke="blue" fill="none" />,
              parentOpen: <FaFolderOpen stroke="blue" fill="none" />,
              leaf: <FaFile stroke="blue" fill="none" />
            }}
          />
          <div>
            <br />
            <br />
            {lang.tr('bottomPanel.logs.botLevelOBS')}
          </div>
        </div>
        <div>
          <Button
            id="btn-save"
            onClick={() => this.saveConfiguration()}
            intent={Intent.PRIMARY}
            fill={true}
            icon="tick"
            text={lang.tr('apply')}
          />
        </div>
      </div>
    )
  }
}
