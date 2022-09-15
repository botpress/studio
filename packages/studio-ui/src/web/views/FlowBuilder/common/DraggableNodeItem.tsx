import { Icon } from '@blueprintjs/core'
import { lang, MoreOptions, MoreOptionsItems } from 'botpress/shared'
import cx from 'classnames'
import _ from 'lodash'
import React, { PropsWithChildren, useState } from 'react'
import { Draggable, DraggableProvided, DraggableStateSnapshot } from 'react-beautiful-dnd'

import style from './style.scss'

export type ItemActionHandler<T> = (item: T, index: number) => void
export type ItemRenderer<T> = (item: T, index: number) => JSX.Element | null

interface Props<T> {
  draggableId: string
  index: number
  item: T
  itemRenderer: ItemRenderer<T>
  onRemove: ItemActionHandler<T>
  onCopy: ItemActionHandler<T>
  onEdit: ItemActionHandler<T>
}

const DraggableNodeItem = <T,>(props: PropsWithChildren<Props<T>>) => {
  const { draggableId, index, item, itemRenderer, onRemove = _.noop, onCopy = _.noop, onEdit = _.noop } = props
  const [displayActionElements, setDisplayActionElements] = useState(false)
  const [isMoreOpen, setIsMoreOpen] = useState(false)

  const itemActionHandler = (handler: ItemActionHandler<T>) => () => {
    setDisplayActionElements(false)
    setIsMoreOpen(false)
    handler(item, index)
  }

  const moreOptionsItems: MoreOptionsItems[] = [
    {
      label: lang.tr('edit'),
      action: itemActionHandler(onEdit)
    },
    {
      label: lang.tr('copy'),
      action: itemActionHandler(onCopy)
    },
    {
      type: 'delete',
      label: lang.tr('delete'),
      action: itemActionHandler(onRemove)
    }
  ]

  return (
    <Draggable draggableId={draggableId} index={index}>
      {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
        <div
          className={cx(style.draggableItem, { [style.dragging]: snapshot.isDragging })}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onMouseEnter={() => setDisplayActionElements(true)}
          onMouseLeave={() => setDisplayActionElements(false)}
        >
          <div className={style.handle}>{displayActionElements && <Icon icon="drag-handle-vertical" />}</div>
          <div className={style.content}>{itemRenderer(item)}</div>
          <div className={style.more}>
            {displayActionElements && (
              <MoreOptions
                className={style.menu}
                show={isMoreOpen}
                onToggle={() => setIsMoreOpen(!isMoreOpen)}
                items={moreOptionsItems}
                wrapInDiv
              />
            )}
          </div>
        </div>
      )}
    </Draggable>
  )
}

export default DraggableNodeItem
