import { Button, Checkbox, Icon } from '@blueprintjs/core'
import { ActionBuilderProps } from 'botpress/sdk'
import { lang } from 'botpress/shared'
import _ from 'lodash'
import React, { Component, Fragment } from 'react'

import ActionItem from '../common/ActionItem'
import DraggableNodeItems from '../common/DraggableNodeItems'
import ActionModalForm, { ActionType, Item } from './ActionModalForm'

import style from './style.scss'

type ActionItems = ActionBuilderProps[] | string[] | null
type ActionItem = ActionBuilderProps | string

interface Props {
  items?: ActionItems
  waitable?: boolean
  readOnly: boolean
  canPaste: boolean
  onItemsUpdated: (items: ActionItem[] | null) => void
  copyItem: (item: ActionItem) => void
  pasteItem: () => void
}

interface State {
  itemToEditIndex: number | null
  showActionModalForm: boolean
}

export default class ActionSection extends Component<Props, State> {
  state: State = {
    showActionModalForm: false,
    itemToEditIndex: null
  }

  optionsToItem(options): string {
    if (options.type === 'message') {
      return options.message
    }
    return options.functionName + ' ' + JSON.stringify(options.parameters || {})
  }

  itemToOptions(item): Item<ActionType> | undefined {
    if (!item) {
      return
    }
    if (item.startsWith('say ')) {
      const chunks = item.split(' ')
      let text = item
      if (chunks.length > 2) {
        text = _.slice(chunks, 2).join(' ')
      }

      return { type: 'message', message: text } as Item<'message'>
    } else {
      const params = item.includes(' ') ? JSON.parse(item.substring(item.indexOf(' ') + 1)) : {}
      return {
        type: 'code',
        functionName: item.split(' ')[0],
        parameters: params
      } as Item<'code'>
    }
  }

  onSubmitAction = (options) => {
    const { itemToEditIndex } = this.state
    const item = this.optionsToItem(options)
    const items = this.props.items ?? []

    const updateByIndex = (originalItem: ActionItem, i: number) =>
      (i === itemToEditIndex ? item : originalItem) as ActionItem

    this.setState({ showActionModalForm: false, itemToEditIndex: null })
    const newItems = _.isNumber(itemToEditIndex) ? items.map(updateByIndex) : [...items, item]
    this.props.onItemsUpdated(newItems)
  }

  onEdit = (_, itemToEditIndex: number) => {
    this.setState({ itemToEditIndex, showActionModalForm: true })
  }

  renderWait() {
    const { items, waitable } = this.props

    if (!waitable || (items?.length ?? 0) > 0) {
      return null
    }

    const checked = _.isArray(items)
    const changeChecked = () => this.props.onItemsUpdated(checked ? null : [])

    return (
      <Checkbox checked={checked} onChange={changeChecked} label={lang.tr('studio.flow.node.waitForUserMessage')} />
    )
  }

  render() {
    const { readOnly } = this.props
    const handleAddAction = () => this.setState({ showActionModalForm: true })
    const items = this.props.items ?? []

    return (
      <Fragment>
        <div className={style.actionList}>
          {this.renderWait()}
          {readOnly && items.map((item) => <ActionItem text={item} />)}
          {!readOnly && (
            <>
              <DraggableNodeItems
                items={items}
                itemRenderer={(item) => <ActionItem text={item} />}
                onItemsChanged={this.props.onItemsUpdated}
                onItemCopy={this.props.copyItem}
                onItemEditClick={this.onEdit}
              />
              <div className={style.actions}>
                <Button
                  id="btn-add-element"
                  minimal
                  large
                  onClick={handleAddAction}
                  icon={<Icon iconSize={16} icon="add" />}
                />
                <Button
                  id="btn-paste-element"
                  minimal
                  large
                  onClick={this.props.pasteItem}
                  disabled={!this.props.canPaste}
                  icon={<Icon iconSize={16} icon="clipboard" />}
                />
              </div>
            </>
          )}
        </div>
        {!readOnly && (
          <ActionModalForm
            show={this.state.showActionModalForm}
            onClose={() => this.setState({ showActionModalForm: false, itemToEditIndex: null })}
            onSubmit={this.onSubmitAction}
            item={
              this.state.itemToEditIndex !== null ? this.itemToOptions(items[this.state.itemToEditIndex]) : undefined
            }
          />
        )}
      </Fragment>
    )
  }
}
