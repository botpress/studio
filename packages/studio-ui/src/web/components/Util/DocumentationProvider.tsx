import { Icon } from '@blueprintjs/core'
import { omit } from 'lodash'
import React, { Component } from 'react'
import { connect } from 'react-redux'

import { addDocumentationHint, removeDocumentationHint, updateDocumentationModal } from '~/actions'

interface Props {
  file: string
  addDocumentationHint?: (file: string) => void
  removeDocumentationHint?: (file: string) => void
}

class StatusBarDocumentationProvider extends Component<Props> {
  componentDidMount() {
    this.props.addDocumentationHint(this.props.file)
  }

  componentWillUnmount() {
    this.props.removeDocumentationHint(this.props.file)
  }

  render() {
    // This is just a lifecycle utility component, it doesn't actually render anything
    return null
  }
}

const _LinkDocumentationProvider = (props) => {
  const passthroughProps = omit(props, 'children', 'onClick', 'href', 'updateDocumentationModal')
  const onClick = (e) => {
    e.preventDefault()

    window.open(`https://botpress.com/docs/${props.file}`, '_blank')
  }
  return (
    <a {...passthroughProps} onClick={onClick}>
      {props.children || <Icon icon="help" />}
    </a>
  )
}

export default connect(null, { addDocumentationHint, removeDocumentationHint })(StatusBarDocumentationProvider)

export const LinkDocumentationProvider = connect(null, { updateDocumentationModal })(_LinkDocumentationProvider)
