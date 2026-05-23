'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

type View = 'home' | 'create' | 'join'

export default function Home() {
  const router = useRouter()
  const [view, setView] = useState<View>('home')
  const [tripName, setTripName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate() {
    if (!tripName.trim()) return
    if (startDate && endDate && endDate < startDate) {
      setError('End date must be on or after start date.')
      return
    }
    setLoading(true)
    setError('')
    const code = generateCode()
    const { error: err } = await supabase.from('trips').insert({
      name: tripName.trim(),
      code,
      start_date: startDate || null,
      end_date: endDate || null,
    })
    if (err) {
      setError('Something went wrong. Try again.')
      setLoading(false)
      return
    }
    router.push(`/trip/${code}`)
  }

  async function handleJoin() {
    if (joinCode.length < 6) return
    setLoading(true)
    setError('')
    const code = joinCode.trim().toUpperCase()
    const { data, error: err } = await supabase.from('trips').select('code').eq('code', code).single()
    if (err || !data) {
      setError("Trip not found. Double-check the code.")
      setLoading(false)
      return
    }
    router.push(`/trip/${code}`)
  }

  function back() {
    setView('home')
    setError('')
    setTripName('')
    setStartDate('')
    setEndDate('')
    setJoinCode('')
  }

  return (
    <main className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-12">
          <div className="text-5xl mb-3">🌴</div>
          <h1 className="text-4xl font-bold text-stone-900 tracking-tight">trip.</h1>
          <p className="text-stone-500 mt-2 text-sm">plan your adventure together</p>
        </div>

        {view === 'home' && (
          <div className="space-y-3">
            <button
              onClick={() => setView('create')}
              className="w-full bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold py-4 rounded-2xl transition-colors text-base"
            >
              Start a trip
            </button>
            <button
              onClick={() => setView('join')}
              className="w-full bg-white hover:bg-stone-100 active:bg-stone-200 text-stone-900 font-semibold py-4 rounded-2xl border border-stone-200 transition-colors text-base"
            >
              Join a trip
            </button>
          </div>
        )}

        {view === 'create' && (
          <div className="space-y-4">
            <button onClick={back} className="flex items-center text-stone-500 text-sm">← Back</button>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Trip name</label>
              <input
                type="text"
                value={tripName}
                onChange={e => setTripName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                placeholder="e.g. SoCal Summer 2026"
                autoFocus
                className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500 text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Start date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500 text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">End date</label>
              <input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={e => setEndDate(e.target.value)}
                className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-stone-900 focus:outline-none focus:ring-2 focus:ring-orange-500 text-base"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              onClick={handleCreate}
              disabled={!tripName.trim() || loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-4 rounded-2xl transition-colors text-base"
            >
              {loading ? 'Creating...' : 'Create trip'}
            </button>
          </div>
        )}

        {view === 'join' && (
          <div className="space-y-4">
            <button onClick={back} className="flex items-center text-stone-500 text-sm">← Back</button>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Trip code</label>
              <input
                type="text"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                placeholder="e.g. SOCAL2"
                maxLength={6}
                autoFocus
                className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-orange-500 text-base tracking-widest font-mono uppercase"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              onClick={handleJoin}
              disabled={joinCode.length < 6 || loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-4 rounded-2xl transition-colors text-base"
            >
              {loading ? 'Joining...' : 'Join trip'}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
