'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  TouchSensor,
  MouseSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { supabase } from '@/lib/supabase'
import { Trip, Item, ItemType } from '@/types'
import DayColumn from '@/components/DayColumn'
import BoardCard from '@/components/BoardCard'
import MoveToDaySheet from '@/components/MoveToDaySheet'

function getDaysBetween(start: string, end: string): string[] {
  const days: string[] = []
  const [sy, sm, sd] = start.split('-').map(Number)
  const [ey, em, ed] = end.split('-').map(Number)
  const cur = new Date(sy, sm - 1, sd)
  const last = new Date(ey, em - 1, ed)
  while (cur <= last) {
    const y = cur.getFullYear()
    const m = String(cur.getMonth() + 1).padStart(2, '0')
    const d = String(cur.getDate()).padStart(2, '0')
    days.push(`${y}-${m}-${d}`)
    cur.setDate(cur.getDate() + 1)
  }
  return days
}

function formatColumnHeader(iso: string): { label: string; sublabel: string } {
  const [year, month, day] = iso.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return {
    label: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
    sublabel: '',
  }
}

export default function BoardPage() {
  const { code } = useParams<{ code: string }>()
  const router = useRouter()

  const sensors = useSensors(
    useSensor(TouchSensor, { activationConstraint: { delay: 500, tolerance: 5 } }),
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
  )

  const [trip, setTrip] = useState<Trip | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeItem, setActiveItem] = useState<Item | null>(null)

  const [movingItem, setMovingItem] = useState<Item | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: tripData } = await supabase
        .from('trips')
        .select('*')
        .eq('code', code)
        .single()

      if (!tripData) {
        setNotFound(true)
        setLoading(false)
        return
      }

      setTrip(tripData)

      const { data: itemsData } = await supabase
        .from('items')
        .select('*')
        .eq('trip_id', tripData.id)
        .order('created_at', { ascending: false })

      setItems(itemsData ?? [])
      setLoading(false)
    }
    load()
  }, [code])

  useEffect(() => {
    if (!trip) return

    const channel = supabase
      .channel(`board-${trip.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'items', filter: `trip_id=eq.${trip.id}` }, payload => {
        setItems(prev => {
          if (prev.some(i => i.id === (payload.new as Item).id)) return prev
          return [payload.new as Item, ...prev]
        })
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'items', filter: `trip_id=eq.${trip.id}` }, payload => {
        setItems(prev => prev.map(i => i.id === payload.new.id ? payload.new as Item : i))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'items', filter: `trip_id=eq.${trip.id}` }, payload => {
        setItems(prev => prev.filter(i => i.id !== (payload.old as Item).id))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [trip])

  async function updateScheduledDate(id: string, date: string | null) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, scheduled_date: date } : i))
    await supabase.from('items').update({ scheduled_date: date }).eq('id', id)
  }

  async function handleToggleDone(id: string, done: boolean) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, done } : i))
    await supabase.from('items').update({ done }).eq('id', id)
  }

  function handleDragStart({ active }: DragStartEvent) {
    const item = items.find(i => i.id === active.id)
    if (item) setActiveItem(item)
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveItem(null)
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string
    if (activeId === overId) return

    const columnIds = new Set(columns.map(c => c.id))

    const activeItem = items.find(i => i.id === activeId)
    if (!activeItem) return
    const activeColId = activeItem.scheduled_date ?? 'unplanned'

    const overColId = columnIds.has(overId)
      ? overId
      : (items.find(i => i.id === overId)?.scheduled_date ?? 'unplanned')

    if (activeColId === overColId && !columnIds.has(overId)) {
      // Within-column reorder
      setItems(prev => {
        const colItems = prev.filter(i => (i.scheduled_date ?? 'unplanned') === activeColId)
        const oldIndex = colItems.findIndex(i => i.id === activeId)
        const newIndex = colItems.findIndex(i => i.id === overId)
        if (oldIndex === -1 || newIndex === -1) return prev
        const reordered = arrayMove(colItems, oldIndex, newIndex)
        const colSet = new Set(colItems.map(i => i.id))
        let cursor = 0
        return prev.map(item => colSet.has(item.id) ? reordered[cursor++] : item)
      })
    } else {
      // Cross-column move
      updateScheduledDate(activeId, overColId === 'unplanned' ? null : overColId)
    }
  }

  function handleCardTap(item: Item) {
    setMovingItem(item)
    setSheetOpen(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <p className="text-stone-400 text-sm">Loading...</p>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-6 text-center">
        <div className="text-4xl mb-4">🤔</div>
        <h2 className="text-xl font-bold text-stone-900 mb-2">Trip not found</h2>
        <button onClick={() => router.push('/')} className="text-orange-500 font-semibold">← Back to home</button>
      </div>
    )
  }

  if (!trip?.start_date || !trip?.end_date) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-6 text-center">
        <div className="text-4xl mb-4">📅</div>
        <h2 className="text-xl font-bold text-stone-900 mb-2">No dates set</h2>
        <p className="text-stone-500 text-sm mb-6">Add start and end dates to your trip to use the board view.</p>
        <Link href={`/trip/${code}`} className="text-orange-500 font-semibold">← Back to list</Link>
      </div>
    )
  }

  const tripDates = getDaysBetween(trip.start_date, trip.end_date)
  const columns: { id: string; label: string; sublabel?: string }[] = [
    { id: 'unplanned', label: 'Unplanned' },
    ...tripDates.map(d => ({ id: d, ...formatColumnHeader(d) })),
  ]

  const itemsByColumn: Record<string, Item[]> = {}
  columns.forEach(c => { itemsByColumn[c.id] = [] })
  items.forEach(item => {
    const col = item.scheduled_date ?? 'unplanned'
    if (itemsByColumn[col] !== undefined) {
      itemsByColumn[col].push(item)
    } else {
      itemsByColumn['unplanned'].push(item)
    }
  })

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-stone-100 sticky top-0 z-30">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <Link href={`/trip/${code}`} className="text-stone-500 text-sm font-medium">← List</Link>
            <h1 className="text-xl font-bold text-stone-900 truncate">{trip.name}</h1>
          </div>
          <span className="bg-stone-100 px-3 py-1.5 rounded-lg font-mono text-sm text-stone-700 font-semibold tracking-widest">
            {code}
          </span>
        </div>
      </div>

      {/* Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 px-4 py-4 overflow-x-auto pb-10" style={{ minHeight: 'calc(100dvh - 73px)' }}>
          {columns.map(col => (
            <DayColumn
              key={col.id}
              columnId={col.id}
              label={col.label}
              sublabel={col.sublabel}
              items={itemsByColumn[col.id]}
              onToggleDone={handleToggleDone}
              onCardTap={handleCardTap}
            />
          ))}
        </div>

        <DragOverlay>
          {activeItem ? (
            <BoardCard
              item={activeItem}
              onToggleDone={handleToggleDone}
              onTap={() => {}}
              isOverlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {movingItem && (
        <MoveToDaySheet
          isOpen={sheetOpen}
          onClose={() => { setSheetOpen(false); setMovingItem(null) }}
          tripDates={tripDates}
          currentDate={movingItem.scheduled_date}
          onMove={date => updateScheduledDate(movingItem.id, date)}
        />
      )}
    </div>
  )
}
