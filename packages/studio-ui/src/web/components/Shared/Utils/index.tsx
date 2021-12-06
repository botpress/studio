import { ActionBuilderProps, ContentElement, FlowNode } from 'botpress/sdk'
import { FlowView, NodeView } from 'common/typings'
import { FlowReducer } from '~/reducers/flows'
import { ContentElementUsage, ContentUsage } from '~/views/Content'

export { default as ElementPreview } from './ElementPreview'
export { toastSuccess, toastFailure, toastInfo, Timeout } from './Toaster'
export { Downloader } from './Downloader'
export { default as AccessControl, isOperationAllowed } from './AccessControl'

export const reorderFlows = (flows: (FlowNode | string)[]) =>
  [
    flows.find(x => getName(x) === 'main'),
    flows.find(x => getName(x) === 'error'),
    flows.find(x => getName(x) === 'timeout'),
    ...flows.filter(x => !['main', 'error', 'timeout'].includes(getName(x)))
  ].filter(x => Boolean(x))

const getName = (x: FlowNode | string) => {
  let name = ''
  if (typeof x === 'string') {
    name = x
  } else {
    name = x.id || x.name
  }

  return name.replace(/\.flow\.json$/i, '')
}

export const getFlowLabel = (name: string) => {
  name = name.replace(/\.flow\.json$/i, '')
  if (name === 'main') {
    return 'Main'
  } else if (name === 'error') {
    return 'Error handling'
  } else if (name === 'timeout') {
    return 'Timeout'
  } else if (name === 'conversation_end') {
    return 'Conversation End'
  } else {
    return name
  }
}

export const getContentItemUsage = (elementId: string, flows: FlowReducer, qnaUsage: ContentElementUsage[]) => {
  const elementUsage: ContentUsage[] = []
  Object.values(flows.flowsByName).forEach((flow: FlowView) => {
    // Skip skill flows
    if (flow.skillData) {
      return
    }

    flow.nodes.forEach((node: NodeView) => {
      const usage: ContentUsage = {
        type: 'Flow',
        name: flow.name,
        node: node.name,
        count: 0
      }

      const addUsage = (v: string | ActionBuilderProps) => {
        if (typeof v === 'string' && v.startsWith(`say #!${elementId}`)) {
          if (!usage.count) {
            elementUsage.push(usage)
          }
          usage.count++
        }
      }

      const addNodeUsage = (node: NodeView) => {
        node.onEnter?.forEach(addUsage)
        node.onReceive?.forEach(addUsage)
      }

      if (node.flow && node.type === 'skill-call') {
        const nodeSubFlow = flows.flowsByName[node.flow]
        nodeSubFlow?.nodes.forEach((node: NodeView) => {
          addNodeUsage(node)
        })
      } else {
        addNodeUsage(node)
      }
    })
  })

  const usage = qnaUsage?.[`#!${elementId}`]
  usage &&
    elementUsage.push({
      type: 'Q&A',
      id: usage.qna,
      name: usage.qna.substr(usage.qna.indexOf('_') + 1),
      count: usage.count
    })

  return elementUsage
}
