import React from 'react'
import ContentItem from './ContentItem'
import ExecuteCodeItem from './ExecuteCodeItem'

interface Props {
  text: string
  className?: string
}

const ActionItem = (props: Props) => {
  const { text } = props
  const isCode = typeof text !== 'string' || !text.startsWith('say ')

  if (isCode) {
    return <ExecuteCodeItem {...props} />
  } else {
    return <ContentItem {...props} />
  }
}

export default ActionItem
