'use client'

import { useRef, useState } from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
  tripDates: string[]
  currentDate: string | null
  onMove: (date: string | null) => void
}

function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function MoveToDaySheet({ isOpen, onClose, tripDates, currentDate, onMove }: Props) {
  const [dragY, setDragY] = useState(0)
  const dragStartY = useRef<number | null>(null)
  const dragging = useRef(false)

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
    if (dragY > 100) { onClose() }
    setDragY(0)
    dragging.current = false
    dragStartY.current = null
  }

  function handlePick(date: string | null) {
    onMove(date)
    onClose()
  }

  const options: { label: string; value: string | null }[] = [
    { label: 'Unplanned', value: null },
    ...tripDates.map(d => ({ label: formatDate(d), value: d })),
  ]

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />}
      <div
        className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl"
        style={{
          maxHeight: '70dvh',
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

        <div className="px-5 pt-2 pb-10">
          <h2 className="text-xl font-bold text-stone-900 mb-4">Move to day</h2>
          <div className="space-y-1">
            {options.map(opt => {
              const selected = opt.value === currentDate
              return (
                <button
                  key={opt.value ?? 'unplanned'}
                  onClick={() => handlePick(opt.value)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-colors text-left ${
                    selected ? 'bg-orange-50 text-orange-600' : 'hover:bg-stone-50 text-stone-800'
                  }`}
                >
                  <span className="font-medium">{opt.label}</span>
                  {selected && (
                    <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
