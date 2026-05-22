'use client'

import { useRef, useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Item, ItemType } from '@/types'

const TYPE_CONFIG: Record<ItemType, { emoji: string; bg: string }> = {
  food:     { emoji: '🍜', bg: 'bg-orange-100' },
  activity: { emoji: '🎯', bg: 'bg-blue-100' },
  shop:     { emoji: '🛍️', bg: 'bg-purple-100' },
}

function getLinkLabel(url: string): string {
  if (url.includes('tiktok.com')) return 'TikTok'
  if (url.includes('instagram.com')) return 'Instagram'
  if (url.includes('maps.google') || url.includes('goo.gl/maps') || url.includes('maps.app.goo')) return 'Maps'
  if (url.includes('yelp.com')) return 'Yelp'
  return 'Link'
}

const HALF = 80   // px: snap to show trash icon
const FULL = 220  // px: auto-delete

interface Props {
  item: Item
  onToggleDone: (id: string, done: boolean) => void
  onDelete: (id: string) => void
}

function TrashIcon() {
  return (
    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}

export default function ItemCard({ item, onToggleDone, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

  const [dragX, setDragX] = useState(0)
  const [snapX, setSnapX] = useState(0)

  const startX = useRef<number | null>(null)
  const startY = useRef<number | null>(null)
  const gestureDir = useRef<'h' | 'v' | null>(null)
  const liveDragX = useRef(0)

  const config = TYPE_CONFIG[item.type]

  function slideAndDelete(dir: number) {
    setDragX(dir >= 0 ? 500 : -500)
    setSnapX(0)
    setTimeout(() => onDelete(item.id), 250)
  }

  function handleTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX
    startY.current = e.touches[0].clientY
    gestureDir.current = null
    liveDragX.current = 0
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (isDragging) return
    if (startX.current === null || startY.current === null) return
    const dx = e.touches[0].clientX - startX.current
    const dy = e.touches[0].clientY - startY.current

    if (gestureDir.current === null) {
      if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return
      gestureDir.current = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v'
      if (gestureDir.current === 'h') setSnapX(0)
    }
    if (gestureDir.current !== 'h') return

    liveDragX.current = dx
    setDragX(dx)
  }

  function handleTouchEnd() {
    if (isDragging) { gestureDir.current = null; return }
    if (gestureDir.current !== 'h') {
      gestureDir.current = null
      return
    }

    const dx = liveDragX.current
    const abs = Math.abs(dx)

    if (abs >= FULL) {
      slideAndDelete(dx)
    } else if (abs >= HALF) {
      setSnapX(dx < 0 ? -HALF : HALF)
      setDragX(0)
    } else {
      setDragX(0)
      setSnapX(0)
    }

    startX.current = null
    startY.current = null
    gestureDir.current = null
    liveDragX.current = 0
  }

  const isGesturing = gestureDir.current === 'h'
  const translateX = isGesturing ? dragX : snapX
  const showTrashLeft = translateX > HALF / 2    // card swiped right → trash on left
  const showTrashRight = translateX < -HALF / 2  // card swiped left → trash on right

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
    >
    <div className={`relative overflow-hidden rounded-2xl ${isDragging ? 'shadow-xl' : 'shadow-sm'}`}>
      {/* Red background */}
      <div className="absolute inset-0 rounded-2xl bg-red-500 flex items-center">
        {showTrashLeft && (
          <button className="pl-5" onClick={e => { e.stopPropagation(); onDelete(item.id) }}>
            <TrashIcon />
          </button>
        )}
        {showTrashRight && (
          <button className="absolute right-0 pr-5" onClick={e => { e.stopPropagation(); onDelete(item.id) }}>
            <TrashIcon />
          </button>
        )}
      </div>

      {/* Card */}
      <div
        className={`bg-white rounded-2xl p-4 border border-stone-100 transition-opacity ${item.done ? 'opacity-60' : ''}`}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isGesturing ? 'none' : 'transform 250ms ease-out',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => { if (snapX !== 0) setSnapX(0) }}
      >
        <div className="flex items-start gap-3">
          <div className={`${config.bg} rounded-xl w-10 h-10 flex items-center justify-center flex-shrink-0 text-lg`}>
            {config.emoji}
          </div>

          <div className="flex-1 min-w-0">
            <p className={`font-semibold text-stone-900 text-base leading-tight ${item.done ? 'line-through text-stone-400' : ''}`}>
              {item.name}
            </p>
            {item.notes && (
              <p className="text-stone-500 text-sm mt-0.5 leading-snug line-clamp-2">{item.notes}</p>
            )}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="text-stone-400 text-xs">{item.added_by}</span>
              {item.link && (
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full hover:bg-stone-200 transition-colors"
                >
                  🔗 {getLinkLabel(item.link)}
                </a>
              )}
            </div>
          </div>

          <button
            onClick={e => { e.stopPropagation(); onToggleDone(item.id, !item.done) }}
            className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
              item.done
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-stone-300 hover:border-green-400'
            }`}
          >
            {item.done && (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        </div>

      </div>
    </div>
    </div>
  )
}
