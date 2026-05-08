'use client'

import { useEffect, useState, FormEvent } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Team, Activity } from '@/types'

export default function Admin() {
  const [teams, setTeams] = useState<Team[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [newTeam, setNewTeam] = useState('')
  const [newActivity, setNewActivity] = useState('')
  const [scoreTeam, setScoreTeam] = useState('')
  const [scoreActivity, setScoreActivity] = useState('')
  const [scorePoints, setScorePoints] = useState('')
  const [status, setStatus] = useState<{ msg: string; ok: boolean } | null>(null)

  async function loadData() {
    const [{ data: t }, { data: a }] = await Promise.all([
      supabase.from('teams').select('*').order('name'),
      supabase.from('activities').select('*').order('name'),
    ])
    if (t) setTeams(t as Team[])
    if (a) setActivities(a as Activity[])
  }

  useEffect(() => { loadData() }, [])

  function flash(msg: string, ok = true) {
    setStatus({ msg, ok })
    setTimeout(() => setStatus(null), 3000)
  }

  async function addTeam(e: FormEvent) {
    e.preventDefault()
    if (!newTeam.trim()) return
    const { error } = await supabase.from('teams').insert({ name: newTeam.trim() })
    if (error) { flash('Feil: ' + error.message, false); return }
    setNewTeam('')
    flash('Lag lagt til!')
    loadData()
  }

  async function addActivity(e: FormEvent) {
    e.preventDefault()
    if (!newActivity.trim()) return
    const { error } = await supabase.from('activities').insert({ name: newActivity.trim() })
    if (error) { flash('Feil: ' + error.message, false); return }
    setNewActivity('')
    flash('Aktivitet lagt til!')
    loadData()
  }

  async function addScore(e: FormEvent) {
    e.preventDefault()
    const points = parseInt(scorePoints, 10)
    if (!scoreTeam || !scoreActivity || isNaN(points) || points < 0) {
      flash('Fyll inn alle felt korrekt.', false)
      return
    }
    const { error } = await supabase.from('scores').insert({
      team_id: scoreTeam,
      activity_id: scoreActivity,
      points,
    })
    if (error) { flash('Feil: ' + error.message, false); return }
    setScorePoints('')
    const team = teams.find(t => t.id === scoreTeam)
    const activity = activities.find(a => a.id === scoreActivity)
    flash(`${points} poeng til ${team?.name} (${activity?.name})`)
  }

  return (
    <div className="min-h-screen bg-[#d6e8f5] px-4 py-10">
      <div className="max-w-lg mx-auto space-y-10">

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900">Admin</h1>
          <Link href="/" className="text-sm text-blue-600 hover:underline">
            ← Poengtavle
          </Link>
        </div>

        {status && (
          <div
            className={`rounded-lg px-4 py-2 text-sm border ${
              status.ok
                ? 'bg-green-50 text-green-800 border-green-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            {status.msg}
          </div>
        )}

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-800">Registrer poeng</h2>
          <form onSubmit={addScore} className="flex flex-col gap-3">
            <select
              value={scoreTeam}
              onChange={e => setScoreTeam(e.target.value)}
              className="border border-zinc-300 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">Velg lag</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <select
              value={scoreActivity}
              onChange={e => setScoreActivity(e.target.value)}
              className="border border-zinc-300 rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="">Velg aktivitet</option>
              {activities.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                value={scorePoints}
                onChange={e => setScorePoints(e.target.value)}
                placeholder="Poeng"
                className="flex-1 border border-zinc-300 rounded-lg px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-blue-700"
              >
                Registrer
              </button>
            </div>
          </form>
        </section>

        <div className="border-t border-zinc-200" />

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-800">Legg til lag</h2>
          <form onSubmit={addTeam} className="flex gap-2">
            <input
              value={newTeam}
              onChange={e => setNewTeam(e.target.value)}
              placeholder="Lagnavn"
              className="flex-1 border border-zinc-300 rounded-lg px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="bg-zinc-800 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-zinc-900"
            >
              Legg til
            </button>
          </form>
          {teams.length > 0 && (
            <ul className="space-y-1">
              {teams.map(t => (
                <li key={t.id} className="text-sm text-zinc-500">— {t.name}</li>
              ))}
            </ul>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-800">Legg til aktivitet</h2>
          <form onSubmit={addActivity} className="flex gap-2">
            <input
              value={newActivity}
              onChange={e => setNewActivity(e.target.value)}
              placeholder="Aktivitetsnavn"
              className="flex-1 border border-zinc-300 rounded-lg px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="bg-zinc-800 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-zinc-900"
            >
              Legg til
            </button>
          </form>
          {activities.length > 0 && (
            <ul className="space-y-1">
              {activities.map(a => (
                <li key={a.id} className="text-sm text-zinc-500">— {a.name}</li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
