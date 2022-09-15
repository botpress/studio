import { Button, Icon } from '@blueprintjs/core'
import { NodeTransition } from 'botpress/sdk'
import { FlowView } from 'common/typings'
import _ from 'lodash'
import React, { Component, Fragment } from 'react'
import DraggableNodeItems from '../common/DraggableNodeItems'

import TransitionItem from '../common/TransitionItem'

import style from './style.scss'
import TransitionModalForm from './TransitionModalForm'

interface Props {
  items: NodeTransition[]
  readOnly: boolean
  canPaste: boolean
  currentFlow: FlowView
  subflows: string[]
  onItemsUpdated: (items: NodeTransition[]) => void
  copyItem: (item: NodeTransition) => void
  pasteItem: () => void
  currentNodeName?: string
}

interface State {
  itemToEditIndex: number | null
  showConditionalModalForm: boolean
}

export default class TransitionSection extends Component<Props, State> {
  state: State = {
    itemToEditIndex: null,
    showConditionalModalForm: false
  }

  onMove(prevIndex: number, direction: number) {
    const clone = [...this.props.items]
    const a = clone[prevIndex]
    const b = clone[prevIndex + direction]

    clone[prevIndex + direction] = a
    clone[prevIndex] = b

    this.props.onItemsUpdated(clone)
  }

  onSubmit = (item: NodeTransition) => {
    const editIndex = this.state.itemToEditIndex
    const { items } = this.props
    const updateByIndex = (originalItem, i) => (i === editIndex ? item : originalItem)
    this.setState({ showConditionalModalForm: false, itemToEditIndex: null })
    this.props.onItemsUpdated(Number.isInteger(editIndex) ? items.map(updateByIndex) : [...items, item])
  }

  onRemove(index: number) {
    const clone = [...this.props.items]
    _.pullAt(clone, [index])
    this.props.onItemsUpdated(clone)
  }

  onCopyAction(index: number) {
    this.props.copyItem(this.props.items[index])
  }

  onEdit = (_, itemToEditIndex: number) => {
    this.setState({ itemToEditIndex, showConditionalModalForm: true })
  }

  render() {
    const { items = [], readOnly } = this.props
    const handleAddAction = () => this.setState({ showConditionalModalForm: true })

    return (
      <Fragment>
        <div id="transition-section">
          {readOnly &&
            items.map((item, i) => (
              <TransitionItem className={style.item} transition={item} position={i} displayType />
            ))}
          {!readOnly && (
            <>
              <DraggableNodeItems<NodeTransition>
                items={items}
                itemRenderer={(item, idx) => (
                  <TransitionItem className={style.item} transition={item} position={idx} displayType />
                )}
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
          <TransitionModalForm
            currentFlow={this.props.currentFlow}
            currentNodeName={this.props.currentNodeName || ''}
            subflows={this.props.subflows}
            show={this.state.showConditionalModalForm}
            onClose={() => this.setState({ showConditionalModalForm: false, itemToEditIndex: null })}
            onSubmit={this.onSubmit}
            item={items[this.state.itemToEditIndex]}
          />
        )}
      </Fragment>
    )
  }
}
