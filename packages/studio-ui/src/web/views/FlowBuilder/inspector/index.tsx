import { H4 } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import cx from 'classnames'
import _ from 'lodash'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import {
  closeFlowNodeProps,
  copyFlowNodeElement,
  pasteFlowNodeElement,
  refreshFlowsLinks,
  requestEditSkill,
  updateFlow,
  updateFlowNode
} from '~/actions'
import { getCurrentFlow, getCurrentFlowNode, RootReducer } from '~/reducers'

import { nodeTypes } from '../diagram/manager'
import FlowInformation from '../nodeProps/FlowInformation'
import SkillCallNode from '../nodeProps/SkillCallNode'
import StandardNode from '../nodeProps/StandardNode'

import style from './style.scss'

interface OwnProps {
  history: any
  onDeleteSelectedElements: () => void
  pasteFlowNode: any
  readOnly: any
  show: any
  updateFlowNode: any
}

type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = typeof mapDispatchToProps
type Props = DispatchProps & StateProps & OwnProps

class Inspector extends Component<Props> {
  render() {
    const { currentFlowNode } = this.props

    const close = () => {
      this.props.closeFlowNodeProps()
    }

    const node = currentFlowNode
    const nodeType = currentFlowNode?.type || (currentFlowNode ? 'standard' : null)
    return (
      <div className={style.inspector}>
        <i className={cx('material-icons', style.closeIcon)} onClick={close}>
          close
        </i>
        <H4>{node ? lang.tr('studio.flow.node.nodeProperties') : lang.tr('studio.flow.flowProperties')}</H4>
        {this.renderNodeProperties(nodeType)}
      </div>
    )
  }

  renderNodeProperties(nodeType: string) {
    const {
      buffer,
      currentFlow,
      currentFlowNode,
      copyFlowNodeElement,
      pasteFlowNodeElement,
      readOnly,
      refreshFlowsLinks,
      requestEditSkill,
      updateFlowNode,
      flows
    } = this.props

    const subflows = _.filter(
      _.map(flows, (f) => f.name),
      (f) => f !== currentFlow?.name
    )

    const updateNodeAndRefresh = (...args) => {
      updateFlowNode(...args)
      setImmediate(() => {
        refreshFlowsLinks()
      })
    }

    if (nodeType === 'skill-call') {
      return (
        <SkillCallNode
          readOnly={readOnly}
          flow={currentFlow}
          subflows={subflows}
          node={currentFlowNode}
          updateNode={updateNodeAndRefresh}
          requestEditSkill={requestEditSkill}
        />
      )
    }

    if (nodeTypes.includes(nodeType)) {
      const isLastNode = currentFlow.nodes.length
        ? currentFlow.nodes[currentFlow.nodes.length - 1].id === currentFlowNode.id
        : false

      return (
        <StandardNode
          isLastNode={isLastNode}
          readOnly={readOnly}
          flow={currentFlow}
          subflows={subflows}
          node={currentFlowNode}
          updateNode={updateNodeAndRefresh}
          copyFlowNodeElement={copyFlowNodeElement}
          pasteFlowNodeElement={pasteFlowNodeElement}
          buffer={buffer}
        />
      )
    }

    return <FlowInformation {...this.props} subflows={subflows} />
  }
}

const mapStateToProps = (state: RootReducer) => ({
  flows: _.values(state.flows.flowsByName),
  currentFlow: getCurrentFlow(state),
  currentFlowNode: getCurrentFlowNode(state) as any,
  buffer: state.flows.buffer,
  user: state.user
})

const mapDispatchToProps = {
  updateFlow,
  requestEditSkill,
  copyFlowNodeElement,
  pasteFlowNodeElement,
  closeFlowNodeProps,
  updateFlowNode,
  refreshFlowsLinks
}

export default connect(mapStateToProps, mapDispatchToProps)(Inspector)
