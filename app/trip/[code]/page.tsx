'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Trip, Item, ItemType } from '@/types'
import ItemCard from '@/components/ItemCard'
import AddItemSheet from '@/components/AddItemSheet'

type Filter = 'all' | ItemType

const FILTERS: { value: Filter; emoji: string; label: string }[] = [
  { value: 'all',      emoji: '',   label: 'All' },
  { value: 'food',     emoji: '🍜', label: 'Food' },
  { value: 'activity', emoji: '🎯', label: 'Activities' },
  { value: 'shop',     emoji: '🛍️', label: 'Shops' },
]

const EMPTY_EMOJI: Record<Filter, string> = {
  all: '✨', food: '🍜', activity: '🎯', shop: '🛍️',
}

export default function TripPage() {
  const { code } = useParams<{ code: string }>()
  const router = useRouter()

  const [trip, setTrip] = useState<Trip | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [filter, setFilter] = useState<Filter>('all')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [copied, setCopied] = useState(false)

  // Initial load
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

  // Realtime subscription
  useEffect(() => {
    if (!trip) return

    const channel = supabase
      .channel(`trip-${trip.id}`)
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

  async function handleAddItem(item: { type: ItemType; name: string; notes: string; link: string; added_by: string }) {
    if (!trip) return
    const { error } = await supabase.from('items').insert({
      trip_id: trip.id,
      type: item.type,
      name: item.name,
      notes: item.notes || null,
      link: item.link || null,
      added_by: item.added_by,
      done: false,
    })
    if (error) throw error
  }

  async function handleToggleDone(id: string, done: boolean) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, done } : i))
    await supabase.from('items').update({ done }).eq('id', id)
  }

  async function handleDelete(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
    await supabase.from('items').delete().eq('id', id)
  }

  function copyCode() {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const filteredItems = (filter === 'all' ? items : items.filter(i => i.type === filter))
    .sort((a, b) => Number(a.done) - Number(b.done))
  const doneCount = items.filter(i => i.done).length
  const allDone = items.length > 0 && doneCount === items.length

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
        <p className="text-stone-500 text-sm mb-6">Check the code and try again.</p>
        <button onClick={() => router.push('/')} className="text-orange-500 font-semibold">
          ← Back to home
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Sticky header */}
      <div className="bg-white border-b border-stone-100 sticky top-0 z-30">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-stone-900 truncate">{trip?.name}</h1>
            <p className="text-stone-400 text-xs mt-0.5">
              {items.length === 0
                ? 'Nothing added yet'
                : `${doneCount} / ${items.length} done${allDone ? ' 🎉' : ''}`}
            </p>
          </div>
          <button
            onClick={copyCode}
            className="ml-3 bg-stone-100 hover:bg-stone-200 active:bg-stone-300 px-3 py-1.5 rounded-lg font-mono text-sm text-stone-700 font-semibold tracking-widest transition-colors min-w-[90px] text-center"
          >
            {copied ? '✓ Copied' : code}
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 px-5 pb-3 overflow-x-auto no-scrollbar">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === f.value
                  ? 'bg-orange-500 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {f.emoji ? `${f.emoji} ${f.label}` : f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Item list */}
      <div className="px-4 py-4 pb-28 space-y-3">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">{EMPTY_EMOJI[filter]}</div>
            <p className="text-stone-500 text-sm">
              {filter === 'all' ? 'Nothing added yet.' : `No ${filter === 'food' ? 'food spots' : filter === 'activity' ? 'activities' : 'shops'} yet.`}
            </p>
            {filter === 'all' && (
              <p className="text-stone-400 text-xs mt-1">Tap + to start building your list!</p>
            )}
          </div>
        ) : (
          filteredItems.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              onToggleDone={handleToggleDone}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setSheetOpen(true)}
        className="fixed bottom-6 right-5 z-40 w-14 h-14 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white rounded-full shadow-lg shadow-orange-200 flex items-center justify-center text-2xl font-light transition-colors"
        aria-label="Add item"
      >
        +
      </button>

      <AddItemSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onAdd={handleAddItem}
      />
    </div>
  )
}
