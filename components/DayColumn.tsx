'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Item } from '@/types'
import BoardCard from './BoardCard'

interface Props {
  columnId: string
  label: string
  sublabel?: string
  items: Item[]
  onToggleDone: (id: string, done: boolean) => void
  onCardTap: (item: Item) => void
}

export default function DayColumn({ columnId, label, sublabel, items, onToggleDone, onCardTap }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId })

  return (
    <div className="flex-shrink-0 w-[80vw] max-w-[320px] flex flex-col">
      {/* Column header */}
      <div className="mb-3 px-0.5">
        <p className="font-bold text-stone-900 text-base leading-tight">{label}</p>
        {sublabel && <p className="text-stone-400 text-xs mt-0.5">{sublabel}</p>}
        <p className="text-stone-400 text-xs mt-0.5">{items.length} {items.length === 1 ? 'item' : 'items'}</p>
      </div>

      {/* Drop zone */}
      <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`flex-1 min-h-[200px] rounded-2xl p-2 space-y-2 transition-colors ${
            isOver ? 'bg-orange-50 ring-2 ring-orange-300' : 'bg-stone-100/60'
          }`}
        >
          {items.map(item => (
            <BoardCard
              key={item.id}
              item={item}
              onToggleDone={onToggleDone}
              onTap={() => onCardTap(item)}
            />
          ))}
          {items.length === 0 && (
            <div className="flex items-center justify-center h-20">
              <p className="text-stone-400 text-sm">Drop here</p>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  )
}
