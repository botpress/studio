import { Button, H3, Tag } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import { FlowView, NodeView } from 'common/typings'
import _ from 'lodash'
import React, { Component } from 'react'

import { AccessControl } from '~/components/Shared/Utils'
import { sanitizeName } from '~/util'
import EditableInput from '../common/EditableInput'
import style from './style.scss'
import TransitionSection from './TransitionSection'

interface Props {
  flow: FlowView
  node: NodeView
  readOnly: boolean
  subflows: string[]
  updateNode: (node: Partial<NodeView>) => void
  requestEditSkill: (id: string) => void
}

export default class SkillCallNodePropertiesPanel extends Component<Props> {
  renameNode = (text) => {
    if (text) {
      const alreadyExists = this.props.flow.nodes.find((x) => x.name === text)
      if (!alreadyExists) {
        this.props.updateNode({ name: text })
      }
    }
  }

  render() {
    const { node, readOnly } = this.props

    const editSkill = () => this.props.requestEditSkill(node.id)

    return (
      <div className={style.node}>
        <EditableInput
          readOnly={readOnly}
          value={node.name}
          className={style.name}
          onChanged={this.renameNode}
          transform={sanitizeName}
        />
        <div style={{ padding: '5px' }}>
          <AccessControl resource="bot.skills" operation="write">
            <Button onClick={editSkill}>{lang.tr('studio.flow.node.editSkill')}</Button>
          </AccessControl>
        </div>
        <H3>
          <Tag minimal>{node.next?.length ?? 0}</Tag> {lang.tr('studio.flow.node.transitions')}
        </H3>
        <TransitionSection
          readOnly={readOnly}
          items={node.next}
          currentFlow={this.props.flow}
          currentNodeName={this.props.node.name}
          subflows={this.props.subflows}
          onItemsUpdated={(items) => this.props.updateNode({ next: items })}
          //missing required props but not used
          canPaste={false}
          copyItem={_.noop}
          pasteItem={_.noop}
        />
      </div>
    )
  }
}
