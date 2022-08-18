import { Popover, PopoverInteractionKind, PopoverPosition, Button, Checkbox, Icon } from '@blueprintjs/core'
import { ActionBuilderProps } from 'botpress/sdk'
import { lang } from 'botpress/shared'
import _ from 'lodash'
import React, { Component, Fragment } from 'react'

import ActionItem from '../common/ActionItem'
import ActionModalForm from './ActionModalForm'

import style from './style.scss'

type ActionItems = ActionBuilderProps[] | string[]
type ActionItem = ActionBuilderProps | string

interface Props {
  items?: ActionItems
  waitable?: boolean
  readOnly: boolean
  canPaste: boolean
  onItemsUpdated: (items: ActionItems) => void
  copyItem: (item: ActionItem) => void
  pasteItem: () => void
}

interface State {
  itemToEditIndex: number | null
  showActionModalForm: boolean
}

export default class ActionSection extends Component<Props, State> {
  state = {
    showActionModalForm: false,
    itemToEditIndex: null
  }

  onMoveAction(prevIndex: number, direction: number) {
    const clone = [...this.props.items]
    const a = clone[prevIndex]
    const b = clone[prevIndex + direction]

    clone[prevIndex + direction] = a
    clone[prevIndex] = b

    this.props.onItemsUpdated(clone as ActionItems)
  }

  optionsToItem(options) {
    if (options.type === 'message') {
      return options.message
    }
    return options.functionName + ' ' + JSON.stringify(options.parameters || {})
  }

  itemToOptions(item) {
    if (item && item.startsWith('say ')) {
      const chunks = item.split(' ')
      let text = item
      if (chunks.length > 2) {
        text = _.slice(chunks, 2).join(' ')
      }

      return { type: 'message', message: text }
    } else if (item) {
      const params = item.includes(' ') ? JSON.parse(item.substring(item.indexOf(' ') + 1)) : {}
      return {
        type: 'code',
        functionName: item.split(' ')[0],
        parameters: params
      }
    }
  }

  onSubmitAction = (options) => {
    const item = this.optionsToItem(options)
    const editIndex = this.state.itemToEditIndex
    const items = this.props.items ?? []

    const updateByIndex = (originalItem, i) => (i === editIndex ? item : originalItem)

    this.setState({ showActionModalForm: false, itemToEditIndex: null })
    this.props.onItemsUpdated(Number.isInteger(editIndex) ? items.map(updateByIndex) : [...(items || []), item])
  }

  onRemoveAction(index: number) {
    const clone = [...this.props.items]
    _.pullAt(clone, [index])
    this.props.onItemsUpdated(clone as ActionItems)
  }

  onCopyAction(index: number) {
    this.props.copyItem(this.props.items[index])
  }

  onEdit(itemToEditIndex: number) {
    this.setState({ itemToEditIndex, showActionModalForm: true })
  }

  renderWait() {
    const { items, waitable } = this.props

    if (!waitable || (items?.length ?? 0) > 0) {
      return null
    }

    const checked = _.isArray(items)

    const changeChecked = () => this.props.onItemsUpdated?.(checked ? null : [])

    return (
      <Checkbox checked={checked} onChange={changeChecked} label={lang.tr('studio.flow.node.waitForUserMessage')} />
    )
  }

  render() {
    const { items = [], readOnly } = this.props
    const handleAddAction = () => this.setState({ showActionModalForm: true })

    return (
      <Fragment>
        <div className={style.actionList}>
          {this.renderWait()}
          {(items || []).map((item, i) => (
            <Popover
              interactionKind={PopoverInteractionKind.HOVER}
              position={PopoverPosition.BOTTOM}
              key={`${i}.${item}`}
            >
              <ActionItem className={style.item} text={item} />
              {!readOnly && (
                <div className={style.actions}>
                  <a onClick={() => this.onEdit(i)}>{lang.tr('edit')}</a>
                  <a onClick={() => this.onRemoveAction(i)}>{lang.tr('remove')}</a>
                  <a onClick={() => this.onCopyAction(i)}>{lang.tr('copy')}</a>
                  {i > 0 && <a onClick={() => this.onMoveAction(i, -1)}>{lang.tr('up')}</a>}
                  {i < items.length - 1 && <a onClick={() => this.onMoveAction(i, 1)}>{lang.tr('down')}</a>}
                </div>
              )}
            </Popover>
          ))}
          {!readOnly && (
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
          )}
        </div>
        {!readOnly && (
          <ActionModalForm
            show={this.state.showActionModalForm}
            onClose={() => this.setState({ showActionModalForm: false, itemToEditIndex: null })}
            onSubmit={this.onSubmitAction}
            item={this.itemToOptions(items && items[this.state.itemToEditIndex])}
          />
        )}
      </Fragment>
    )
  }
}
