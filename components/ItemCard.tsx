'use client'

import { useState } from 'react'
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

interface Props {
  item: Item
  onToggleDone: (id: string, done: boolean) => void
  onDelete: (id: string) => void
}

export default function ItemCard({ item, onToggleDone, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false)
  const config = TYPE_CONFIG[item.type]

  return (
    <div
      className={`bg-white rounded-2xl p-4 shadow-sm border border-stone-100 transition-opacity ${item.done ? 'opacity-60' : ''}`}
      onClick={() => setExpanded(s => !s)}
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

      {expanded && (
        <div className="mt-3 pt-3 border-t border-stone-100 flex justify-end">
          <button
            onClick={e => { e.stopPropagation(); onDelete(item.id) }}
            className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Remove
          </button>
        </div>
      )}
    </div>
  )
}
