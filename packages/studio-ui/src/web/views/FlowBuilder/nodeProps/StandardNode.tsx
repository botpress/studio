import { Tag } from '@blueprintjs/core'
import { lang, Tabs, toast } from 'botpress/shared'
import { FlowView, NodeView } from 'common/typings'
import React, { useState } from 'react'

import { sanitizeName } from '~/util'

import EditableInput from '../common/EditableInput'

import ActionSection from './ActionSection'
import style from './style.scss'
import TransitionSection from './TransitionSection'

type TabId = 'on-enter' | 'on-receive' | 'transitions'

interface Tab {
  id: TabId
  disabled?: boolean
  className?: string
  title: string | JSX.Element
}

interface Props {
  flow: FlowView
  node: NodeView
  subflows: string[]
  readOnly: boolean
  isLastNode: boolean
  updateNode: (node: Partial<NodeView>) => void
  copyFlowNodeElement: Function
  pasteFlowNodeElement: Function
  buffer: any
}

const nodeNameRe = /node-(\w|\n){4}$/g

export default (props: Props) => {
  const [currentTab, setCurrentTab] = useState<TabId>('on-enter')

  const { node, readOnly, isLastNode } = props

  const tabs: Tab[] = [
    {
      id: 'on-enter',
      title: (
        <span>
          <Tag minimal>{node.onEnter?.length ?? 0}</Tag> {lang.tr('studio.flow.node.onEnter')}
        </span>
      )
    },
    {
      id: 'on-receive',
      title: (
        <span>
          <Tag minimal>{node.onReceive?.length ?? 0}</Tag> {lang.tr('studio.flow.node.onReceive')}
        </span>
      )
    },
    {
      id: 'transitions',
      title: (
        <span>
          <Tag minimal>{node.next?.length ?? 0}</Tag> {lang.tr('studio.flow.node.transitions')}
        </span>
      )
    }
  ]

  const onChange = (text: string) => {
    if (!text) {
      return toast.failure(lang.tr('studio.flow.node.emptyName'))
    }

    if (text === props.node.name) {
      return props.node
    }

    const alreadyExists = props.flow.nodes.find((x) => x.name === text)
    if (alreadyExists) {
      return toast.failure(lang.tr('studio.flow.node.nameAlreadyExists'))
    }

    props.updateNode({ name: text })
  }

  return (
    <div className={style.node}>
      <EditableInput
        key={node.id}
        shouldFocus={isLastNode && node.name.match(nodeNameRe)}
        readOnly={readOnly}
        value={node.name}
        className={style.name}
        onChanged={onChange}
        transform={sanitizeName}
      />
      <Tabs
        id="node-props-modal-flow-tabs"
        className={style.inspectorTabs}
        tabs={tabs}
        currentTab={currentTab}
        tabChange={(tab: TabId) => setCurrentTab(tab)}
      />
      {currentTab === 'on-enter' && (
        <ActionSection
          readOnly={readOnly}
          items={node.onEnter}
          onItemsUpdated={(items) => props.updateNode({ onEnter: items })}
          copyItem={(item) => props.copyFlowNodeElement({ action: item })}
          pasteItem={() => props.pasteFlowNodeElement('onEnter')}
          canPaste={Boolean(props.buffer.action)}
        />
      )}
      {currentTab === 'on-receive' && (
        <ActionSection
          readOnly={readOnly}
          waitable
          items={node.onReceive}
          onItemsUpdated={(items) => props.updateNode({ onReceive: items })}
          copyItem={(item) => props.copyFlowNodeElement({ action: item })}
          pasteItem={() => props.pasteFlowNodeElement('onReceive')}
          canPaste={Boolean(props.buffer.action)}
        />
      )}
      {currentTab === 'transitions' && (
        <TransitionSection
          readOnly={readOnly}
          items={node.next}
          currentFlow={props.flow}
          currentNodeName={node.name}
          subflows={props.subflows}
          onItemsUpdated={(items) => props.updateNode({ next: items })}
          copyItem={(item) => props.copyFlowNodeElement({ transition: item })}
          pasteItem={() => props.pasteFlowNodeElement('next')}
          canPaste={Boolean(props.buffer.transition)}
        />
      )}
    </div>
  )
}
