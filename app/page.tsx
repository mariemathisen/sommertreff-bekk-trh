'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Team, Score } from '@/types'

type RankedTeam = Team & { total: number }

const RANK_STYLES = [
  'bg-amber-400/30 border-amber-300/50 text-amber-100',
  'bg-zinc-300/20 border-zinc-200/40 text-zinc-100',
  'bg-orange-600/25 border-orange-400/40 text-orange-100',
]

export default function Scoreboard() {
  const [teams, setTeams] = useState<RankedTeam[]>([])
  const [loading, setLoading] = useState(true)
  const [live, setLive] = useState(false)

  useEffect(() => {
    async function load() {
      const [{ data: teamsData }, { data: scoresData }] = await Promise.all([
        supabase.from('teams').select('*').order('created_at'),
        supabase.from('scores').select('*'),
      ])

      if (!teamsData) return

      const scores = (scoresData ?? []) as Score[]
      const ranked: RankedTeam[] = (teamsData as Team[]).map(team => ({
        ...team,
        total: scores
          .filter(s => s.team_id === team.id)
          .reduce((sum, s) => sum + s.points, 0),
      }))
      ranked.sort((a, b) => b.total - a.total)
      setTeams(ranked)
      setLoading(false)
    }

    load()

    const channel = supabase
      .channel('scores-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scores' }, load)
      .subscribe(status => {
        setLive(status === 'SUBSCRIBED')
      })

    return () => { supabase.removeChannel(channel) }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-500 to-blue-700 flex flex-col items-center px-4 py-12">
      <div className="flex flex-col items-center mb-10">
        <h1 className="text-5xl font-bold text-white tracking-tight">Sommertreff</h1>
        <div className="flex items-center gap-2 mt-3">
          <span className="text-sky-200 text-lg">Poengtavle</span>
          {live && (
            <span className="flex items-center gap-1 text-xs text-emerald-300 font-medium">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              LIVE
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-white/60 text-lg">Laster...</p>
      ) : teams.length === 0 ? (
        <p className="text-white/60 text-lg">Ingen lag registrert ennå.</p>
      ) : (
        <div className="w-full max-w-lg flex flex-col gap-3">
          {teams.map((team, i) => (
            <div
              key={team.id}
              className={`flex items-center gap-4 border backdrop-blur-sm rounded-2xl px-6 py-4 ${RANK_STYLES[i] ?? 'bg-white/10 border-white/20 text-white'}`}
            >
              <span className="w-8 text-center text-xl font-bold tabular-nums opacity-80">
                {i + 1}.
              </span>
              <span className="flex-1 text-xl font-semibold">{team.name}</span>
              <span className="text-3xl font-bold tabular-nums">{team.total}</span>
            </div>
          ))}
        </div>
      )}

      <Link
        href="/admin"
        className="mt-16 text-sky-300/60 hover:text-sky-200 text-sm transition-colors"
      >
        Admin
      </Link>
    </div>
  )
}
