'use client'

import { useRef, useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { Item, ItemType } from '@/types'

const TYPE_CONFIG: Record<ItemType, { emoji: string; bg: string }> = {
  food:     { emoji: '🍜', bg: 'bg-orange-100' },
  activity: { emoji: '🎯', bg: 'bg-blue-100' },
  shop:     { emoji: '🛍️', bg: 'bg-purple-100' },
}

type PlatformInfo = { label: string; Icon: () => React.ReactElement }

function getPlatform(url: string): PlatformInfo {
  if (url.includes('tiktok.com')) return {
    label: 'TikTok',
    Icon: () => (
      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.97a8.27 8.27 0 004.84 1.55V7.07a4.85 4.85 0 01-3.07-.38z" />
      </svg>
    ),
  }
  if (url.includes('instagram.com')) return {
    label: 'Instagram',
    Icon: () => (
      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  }
  if (url.includes('maps.google') || url.includes('goo.gl/maps') || url.includes('maps.app.goo')) return {
    label: 'Maps',
    Icon: () => (
      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" />
      </svg>
    ),
  }
  if (url.includes('yelp.com')) return {
    label: 'Yelp',
    Icon: () => (
      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
      </svg>
    ),
  }
  if (url.includes('youtube.com') || url.includes('youtu.be')) return {
    label: 'YouTube',
    Icon: () => (
      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 00.5 6.19C0 8.04 0 12 0 12s0 3.96.5 5.81a3.02 3.02 0 002.12 2.14C4.46 20.5 12 20.5 12 20.5s7.54 0 9.38-.55a3.02 3.02 0 002.12-2.14C24 15.96 24 12 24 12s0-3.96-.5-5.81zM9.75 15.5V8.5l6.5 3.5-6.5 3.5z" />
      </svg>
    ),
  }
  return {
    label: 'Link',
    Icon: () => (
      <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  }
}

const HALF = 80
const FULL = 220

interface Props {
  item: Item
  onToggleDone: (id: string, done: boolean) => void
  onDelete: (id: string) => void
  onEdit: (item: Item) => void
}

function TrashIcon() {
  return (
    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  )
}

export default function ItemCard({ item, onToggleDone, onDelete, onEdit }: Props) {
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
  const showTrashLeft = translateX > HALF / 2
  const showTrashRight = translateX < -HALF / 2

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: transform ? `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0)` : undefined,
        transition,
      }}
      {...attributes}
      {...listeners}
    >
      <div className={`relative overflow-hidden rounded-2xl ${isDragging ? 'shadow-xl' : 'shadow-sm'}`}>
        {/* Red delete background */}
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
          className={`bg-white rounded-2xl p-4 border border-stone-100 ${item.done ? 'opacity-60' : ''}`}
          style={{
            transform: `translateX(${translateX}px)`,
            transition: isGesturing ? 'none' : 'transform 250ms ease-out',
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={() => { if (snapX !== 0) { setSnapX(0); return } onEdit(item) }}
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
              {(item.links?.length > 0 || item.added_by) && (
                <div className="flex items-start gap-1.5 mt-1.5 flex-wrap">
                  <span className="text-stone-400 text-xs">{item.added_by}</span>
                  {item.links?.map((link, i) => {
                    const platform = getPlatform(link)
                    return (
                      <a
                        key={i}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="flex items-center gap-1 text-xs bg-stone-100 text-stone-600 hover:bg-stone-200 active:bg-stone-300 px-2 py-0.5 rounded-full touch-manipulation transition-colors"
                      >
                        <platform.Icon />
                        {platform.label}
                      </a>
                    )
                  })}
                </div>
              )}
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
