import { Button } from '@blueprintjs/core'
import { lang, ToolTip } from 'botpress/shared'
import { FlowView, NodeView } from 'common/typings'
import ELK, { ElkNode } from 'elkjs/lib/elk.bundled.js'
import { nanoid } from 'nanoid'
import React, { FC } from 'react'
import { connect } from 'react-redux'

import { updateFlow } from '~/actions'
import { getCurrentFlow, RootReducer } from '~/reducers'

import style from './style.scss'

type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = typeof mapDispatchToProps

type Props = DispatchProps & StateProps

const ElkGraphtoFlow = (flow: FlowView, graph: ElkNode): Partial<FlowView> => {
  const nodes = graph.children.reduce((data, node) => {
    data[node.id] = node
    return data
  }, {})

  return {
    nodes: flow.nodes.map((value: NodeView) => ({
      ...value,
      x: nodes[value.id].x,
      y: nodes[value.id].y
    }))
  }
}

const flowToElkGraph = (flow: FlowView): ElkNode => ({
  id: 'root',
  children: flow.nodes.map(value => ({
    id: value.id,
    layoutOptions: {},
    width: 250,
    height: 200
  })),
  edges: flow.links.map(link => ({
    id: nanoid(),
    sources: [link.source],
    targets: [link.target]
  }))
})

const layout = async (flow: FlowView, update: typeof updateFlow) => {
  const elk = new ELK({
    defaultLayoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.spacing.edgeNode': '50'
    }
  })

  const newGraph = await elk.layout(flowToElkGraph(flow))
  update(ElkGraphtoFlow(flow, newGraph))
}

const LayoutToolbar: FC<Props> = ({ flow, updateFlow }) => (
  <div className={style.layoutWrapper}>
    <ToolTip content={lang.tr('studio.layout')}>
      <Button icon="layout-hierarchy" onClick={() => layout(flow, updateFlow)} />
    </ToolTip>
  </div>
)

const mapStateToProps = (state: RootReducer) => ({
  flow: getCurrentFlow(state)
})

const mapDispatchToProps = {
  updateFlow
}

export default connect<StateProps, DispatchProps>(mapStateToProps, mapDispatchToProps)(LayoutToolbar)
