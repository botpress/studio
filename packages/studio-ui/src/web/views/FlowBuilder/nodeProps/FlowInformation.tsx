import { Tag } from '@blueprintjs/core'
import { lang, Tabs } from 'botpress/shared'
import classnames from 'classnames'
import { FlowView } from 'common/typings'
import React, { useState } from 'react'

import ActionSection from './ActionSection'
import style from './style.scss'
import TransitionSection from './TransitionSection'

type TabId = 'on-receive' | 'transitions'

interface Tab {
  id: TabId
  disabled?: boolean
  className?: string
  title: string | JSX.Element
}

interface Props {
  readOnly: boolean
  currentFlow: FlowView
  subflows: string[]
  buffer: any
  updateFlow: (flow: Partial<FlowView>) => void
  copyFlowNodeElement: Function
  pasteFlowNodeElement: Function
}

export default (props: Props) => {
  const [currentTab, setCurrentTab] = useState<TabId>('on-receive')
  const catchAll = Object.assign(
    {
      onReceive: [],
      next: []
    },
    props.currentFlow.catchAll && props.currentFlow.catchAll
  )

  const tabs: Tab[] = [
    {
      id: 'on-receive',
      title: (
        <span>
          <Tag minimal>{catchAll.onReceive?.length ?? 0}</Tag> {lang.tr('studio.flow.node.onReceive')}
        </span>
      )
    },
    {
      id: 'transitions',
      title: (
        <span>
          <Tag minimal>{catchAll.next?.length ?? 0}</Tag> {lang.tr('studio.flow.node.transitions')}
        </span>
      )
    }
  ]

  return (
    <div className={classnames(style.node)}>
      <Tabs
        id="node-props-modal-flow-tabs"
        tabs={tabs}
        currentTab={currentTab}
        className={style.inspectorTabs}
        tabChange={(tab: TabId) => setCurrentTab(tab)}
      />
      {currentTab === 'on-receive' && (
        <ActionSection
          readOnly={props.readOnly}
          items={catchAll.onReceive}
          onItemsUpdated={(items) => props.updateFlow({ catchAll: { ...catchAll, onReceive: items } })}
          copyItem={(item) => props.copyFlowNodeElement({ action: item })}
          pasteItem={() => props.pasteFlowNodeElement('onReceive')}
          canPaste={Boolean(props.buffer.action)}
        />
      )}
      {currentTab === 'transitions' && (
        <TransitionSection
          readOnly={props.readOnly}
          items={catchAll.next}
          currentFlow={props.currentFlow}
          subflows={props.subflows}
          onItemsUpdated={(items) => props.updateFlow({ catchAll: { ...catchAll, next: items } })}
          copyItem={(item) => props.copyFlowNodeElement({ transition: item })}
          pasteItem={() => props.pasteFlowNodeElement('next')}
          canPaste={Boolean(props.buffer.transition)}
        />
      )}
    </div>
  )
}
