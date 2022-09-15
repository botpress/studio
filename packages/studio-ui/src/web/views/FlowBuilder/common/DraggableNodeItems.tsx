import _ from 'lodash'
import React, { PropsWithChildren, useCallback, useEffect, useState } from 'react'
import { Droppable, DragDropContext, DroppableProvided, DropResult } from 'react-beautiful-dnd'
import DraggableNodeItem, { ItemActionHandler, ItemRenderer } from './DraggableNodeItem'

interface Props<T> {
  items: T[]
  itemRenderer: ItemRenderer<T>
  onItemsChanged: (items: T[]) => void
  onItemCopy: ItemActionHandler<T>
  onItemEditClick: ItemActionHandler<T>
}

const generateUniqIds = (items: any[]): string[] => items.map(_.uniqueId.bind(null))

const DraggableNodeItems = <T,>(props: PropsWithChildren<Props<T>>) => {
  const { items } = props
  const [draggableIndides, setDraggableIndides] = useState<string[]>(generateUniqIds(items))

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      const { source, destination, reason } = result
      if (reason === 'CANCEL') {
        return
      }

      const newItems = [...props.items]
      const [movedItem] = newItems.splice(source.index, 1)
      newItems.splice(destination.index, 0, movedItem)

      props.onItemsChanged(newItems)
    },
    [props.items]
  )

  useEffect(() => {
    setDraggableIndides(generateUniqIds(items))
  }, [props.items])

  const handleDeleteClick = (idx: number) => {
    const newItems = [...items.slice(0, idx), ...items.slice(idx + 1)]
    props.onItemsChanged(newItems)
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="node-item-droppable">
        {(provided: DroppableProvided) => (
          <div ref={provided.innerRef} {...provided.droppableProps}>
            {items.map((item: T, idx: number) => (
              <DraggableNodeItem
                draggableId={draggableIndides[idx]}
                index={idx}
                key={draggableIndides[idx]}
                item={item}
                itemRenderer={props.itemRenderer}
                onCopy={props.onItemCopy}
                onRemove={() => handleDeleteClick(idx)}
                onEdit={(item) => props.onItemEditClick(item, idx)}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}

export default DraggableNodeItems
