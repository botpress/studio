import { H4, Icon, Popover, PopoverInteractionKind, Tag } from '@blueprintjs/core'
import { NodeTransition } from 'botpress/sdk'
import { lang } from 'botpress/shared'
import classnames from 'classnames'
import _ from 'lodash'
import Mustache from 'mustache'
import React, { Component } from 'react'
import { restoreDots, stripDots } from '~/util'

import style from './style.scss'

interface Props {
  transition: NodeTransition
  position: number
  className?: string
  displayType?: boolean
}

export default class TransitionItem extends Component<Props> {
  renderType = (): JSX.Element => {
    if (!this.props.displayType) {
      return null
    }
    const transition = this.props.transition
    if (!transition.node || transition.node === '') {
      return (
        <Tag minimal intent="danger">
          {lang.tr('studio.flow.node.missingLink')}
        </Tag>
      )
    }

    if (transition.node === 'END') {
      return (
        <Tag minimal intent="warning">
          {lang.tr('studio.flow.node.end')}
        </Tag>
      )
    }

    if (transition.node === '#') {
      return (
        <Tag minimal intent="warning">
          {lang.tr('studio.flow.node.return')}
        </Tag>
      )
    }

    if (transition.node.includes('.flow.json')) {
      return (
        <Tag minimal intent="primary">
          {transition.node}
        </Tag>
      )
    }

    return <Tag minimal>{transition.node}</Tag>
  }

  renderNormal(child) {
    return child
  }

  render() {
    let raw
    const { position } = this.props
    const { condition, caption } = this.props.transition

    if (caption) {
      const vars = {}
      const htmlTpl = caption.replace(/\[(.+)]/gi, (x) => {
        const name = stripDots(x.replace(/[\[\]]/g, ''))
        vars[name] = `<span class="val">${_.escape(name)}</span>`
        return '{{{' + name + '}}}'
      })

      raw = restoreDots(Mustache.render(htmlTpl, vars))
    } else {
      if ((condition && condition.length <= 0) || /^(yes|true)$/i.test(condition.toLowerCase())) {
        raw = position === 0 ? 'always' : 'otherwise'
      } else {
        raw = condition
      }
    }

    const PopoverContent: JSX.Element = (
      <div className={style.popoverContent}>
        <H4>
          <Icon icon="fork" />
          &nbsp;Conditional transition
        </H4>
        <pre>{condition}</pre>
      </div>
    )

    const Target: JSX.Element = (
      <div className={classnames(this.props.className, style['action-item'], style['condition'])}>
        <Icon icon="fork" iconSize={10} />
        &nbsp;
        <span className={style.name} dangerouslySetInnerHTML={{ __html: raw }} />
        {this.renderType()}
      </div>
    )

    if (!!caption) {
      return (
        <Popover
          target={Target}
          interactionKind={PopoverInteractionKind.HOVER}
          content={PopoverContent}
          minimal
          position="left"
        />
      )
    } else {
      return Target
    }
  }
}
