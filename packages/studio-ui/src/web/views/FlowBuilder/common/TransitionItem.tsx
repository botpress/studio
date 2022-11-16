import { H4, Icon, Popover, PopoverInteractionKind, Tag } from '@blueprintjs/core'
import { NodeTransition } from 'botpress/sdk'
import { lang } from 'botpress/shared'
import classnames from 'classnames'
import _ from 'lodash'
import Mustache from 'mustache'
import React, { Component } from 'react'
import withLanguage from '~/components/Util/withLanguage'
import { restoreDots, stripDots } from '~/util'

import style from './style.scss'

const INTENT_CONDITION_PREFIX = 'event.nlu.intent.name === '

interface Props {
  transition: NodeTransition
  position: number
  className?: string
  displayType?: boolean
  contentLang: string
  defaultLanguage: string
}

class TransitionItem extends Component<Props> {
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
    const { position, transition, contentLang, defaultLanguage } = this.props
    const { condition } = transition

    const caption =
      transition[`caption$${contentLang}`] || transition[`caption$${defaultLanguage}`] || transition.caption

    if (caption && typeof caption === 'string') {
      const vars = {}
      const htmlTpl = lang.tr(caption).replace(/\[(.+)]/gi, (x) => {
        const name = stripDots(x.replace(/[\[\]]/g, ''))
        vars[name] = `<span class="val">${_.escape(name)}</span>`
        return '{{{' + name + '}}}'
      })

      raw = restoreDots(Mustache.render(htmlTpl, vars))
    } else {
      if ((condition && condition.length <= 0) || /^(yes|true)$/i.test(condition.toLowerCase())) {
        raw = position === 0 ? 'always' : 'otherwise'
      } else if (condition.includes(INTENT_CONDITION_PREFIX)) {
        const intentName = condition.slice(INTENT_CONDITION_PREFIX.length)
        raw = lang.tr('studio.flow.node.transition.condition.intentIs', { intentName })
      } else {
        raw = condition
      }
    }

    const PopoverContent: JSX.Element = (
      <div className={style.popoverContent}>
        <H4>
          <Icon icon="fork" />
          &nbsp;{lang.tr('studio.flow.node.transition.condition.conditionalTransition')}
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
          usePortal
          boundary="viewport"
          interactionKind={PopoverInteractionKind.HOVER}
          minimal
          position="left"
          hoverOpenDelay={250}
          portalClassName={style.popoverPortal}
          target={Target}
          content={PopoverContent}
        />
      )
    } else {
      return Target
    }
  }
}

export default withLanguage(TransitionItem)
