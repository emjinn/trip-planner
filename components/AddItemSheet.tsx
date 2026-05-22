'use client'

import { useState, useEffect, useRef } from 'react'
import { ItemType } from '@/types'

const TYPE_OPTIONS: { type: ItemType; emoji: string; label: string }[] = [
  { type: 'food',     emoji: '🍜', label: 'Food' },
  { type: 'activity', emoji: '🎯', label: 'Activity' },
  { type: 'shop',     emoji: '🛍️', label: 'Shop' },
]

const USER_NAME_KEY = 'trip_user_name'

interface Props {
  isOpen: boolean
  onClose: () => void
  onAdd: (item: { type: ItemType; name: string; notes: string; links: string[]; added_by: string }) => Promise<void>
}

export default function AddItemSheet({ isOpen, onClose, onAdd }: Props) {
  const [type, setType] = useState<ItemType>('food')
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [links, setLinks] = useState<string[]>([''])
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dragY, setDragY] = useState(0)
  const dragStartY = useRef<number | null>(null)
  const dragging = useRef(false)

  useEffect(() => {
    const saved = localStorage.getItem(USER_NAME_KEY)
    if (saved) setUserName(saved)
  }, [])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    if (!isOpen) setDragY(0)
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  function handleTouchStart(e: React.TouchEvent) {
    dragStartY.current = e.touches[0].clientY
    dragging.current = true
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (!dragging.current || dragStartY.current === null) return
    const delta = e.touches[0].clientY - dragStartY.current
    if (delta > 0) setDragY(delta)
  }

  function handleTouchEnd() {
    if (dragY > 100) { onClose(); reset() }
    setDragY(0)
    dragging.current = false
    dragStartY.current = null
  }

  function reset() {
    setType('food')
    setName('')
    setNotes('')
    setLinks([''])
    setError('')
  }

  function updateLink(i: number, val: string) {
    setLinks(l => l.map((v, idx) => idx === i ? val : v))
  }

  function removeLink(i: number) {
    setLinks(l => l.filter((_, idx) => idx !== i))
  }

  async function handleSubmit() {
    if (!name.trim()) { setError('Name is required.'); return }
    if (!userName.trim()) { setError('Your name is required.'); return }
    setLoading(true)
    setError('')
    localStorage.setItem(USER_NAME_KEY, userName.trim())
    try {
      const cleanLinks = links.map(l => l.trim()).filter(Boolean)
      await onAdd({ type, name: name.trim(), notes: notes.trim(), links: cleanLinks, added_by: userName.trim() })
      reset()
      onClose()
    } catch {
      setError('Failed to add. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500 text-base"

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />}

      <div
        className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl"
        style={{
          maxHeight: '92dvh',
          overflowY: 'auto',
          transform: isOpen ? `translateY(${dragY}px)` : 'translateY(100%)',
          transition: dragging.current && dragY > 0 ? 'none' : 'transform 300ms ease-out',
        }}
      >
        <div
          className="flex justify-center pt-3 pb-1 touch-none cursor-grab active:cursor-grabbing"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-10 h-1 bg-stone-200 rounded-full" />
        </div>

        <div className="px-5 pb-10 pt-2">
          <h2 className="text-xl font-bold text-stone-900 mb-5">Add to your list</h2>

          {/* Type selector */}
          <div className="flex gap-2 mb-5">
            {TYPE_OPTIONS.map(opt => (
              <button
                key={opt.type}
                onClick={() => setType(opt.type)}
                className={`flex-1 flex flex-col items-center py-3 rounded-xl border-2 transition-all ${
                  type === opt.type ? 'border-orange-500 bg-orange-50' : 'border-stone-200 bg-white'
                }`}
              >
                <span className="text-xl">{opt.emoji}</span>
                <span className={`text-xs font-medium mt-1 ${type === opt.type ? 'text-orange-600' : 'text-stone-600'}`}>
                  {opt.label}
                </span>
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Broken Mouth"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Neighborhood, hours, any details..."
                rows={2}
                className={`${inputClass} resize-none`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Links</label>
              <div className="space-y-2">
                {links.map((link, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="url"
                      value={link}
                      onChange={e => updateLink(i, e.target.value)}
                      placeholder="Paste TikTok, Maps, Yelp link..."
                      className={`${inputClass} flex-1`}
                    />
                    {links.length > 1 && (
                      <button
                        onClick={() => removeLink(i)}
                        className="text-stone-400 hover:text-stone-600 p-1 flex-shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                {links.length < 5 && (
                  <button
                    onClick={() => setLinks(l => [...l, ''])}
                    className="text-sm text-orange-500 font-medium hover:text-orange-600 transition-colors"
                  >
                    + Add another link
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Your name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={userName}
                onChange={e => setUserName(e.target.value)}
                placeholder="e.g. Emily"
                className={inputClass}
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full mt-6 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-4 rounded-2xl transition-colors text-base"
          >
            {loading ? 'Adding...' : 'Add to list'}
          </button>
        </div>
      </div>
    </>
  )
}
