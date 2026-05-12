'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { LayoutGroup } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import type { Team, Score } from '@/types'
import { RaceTrack } from '@/components/scoreboard/RaceTrack'

type TeamWithPoints = Team & {
  points: number
  delta?: number
}

export default function PoengoversiktPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [scores, setScores] = useState<Score[]>([])
  const [error, setError] = useState<string | null>(null)
  const prevPointsRef = useRef<Record<string, number>>({})

  async function loadScoreboard() {
    setError(null)

    const [{ data: teamData, error: teamError }, { data: scoreData, error: scoreError }] = await Promise.all([
      supabase.from('teams').select('*'),
      supabase.from('scores').select('*'),
    ])

    if (teamError || scoreError) {
      setError(teamError?.message ?? scoreError?.message ?? 'Kunne ikke hente poengoversikt.')
      return
    }

    setTeams((teamData as Team[]) ?? [])
    setScores((scoreData as Score[]) ?? [])
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadScoreboard()

    const channel = supabase
      .channel('scoreboard-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scores' }, () => {
        loadScoreboard()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const leaderboard = useMemo<TeamWithPoints[]>(() => {
    const pointsByTeamId = scores.reduce<Record<string, number>>((acc, score) => {
      acc[score.team_id] = (acc[score.team_id] ?? 0) + score.points
      return acc
    }, {})

    const sorted = teams
      .map((team) => {
        const currentPoints = pointsByTeamId[team.id] ?? 0
        const prevPoints = prevPointsRef.current[team.id]
        const delta = prevPoints != null ? currentPoints - prevPoints : undefined

        return {
          ...team,
          points: currentPoints,
          delta: delta && delta > 0 ? delta : undefined,
        }
      })
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points
        return a.name.localeCompare(b.name, 'nb')
      })

    // Store current points for next delta calculation
    const newPoints: Record<string, number> = {}
    for (const team of sorted) {
      newPoints[team.id] = team.points
    }
    prevPointsRef.current = newPoints

    return sorted
  }, [teams, scores])

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0b1525] via-[#1a2744] to-[#0d2137] px-4 py-8 md:px-6 md:py-12 text-white">
      {/* Animated background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-purple-600/20 blur-3xl animate-blob" />
        <div className="absolute top-1/3 -right-20 h-96 w-96 rounded-full bg-cyan-500/15 blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-20 left-1/3 h-72 w-72 rounded-full bg-pink-500/15 blur-3xl animate-blob animation-delay-4000" />
      </div>

      <div className="relative mx-auto max-w-4xl">
        <Link
          href="/"
          className="group fixed left-6 top-4 z-50 flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md border border-white/20 transition-all hover:bg-white/20 hover:shadow-md hover:gap-2.5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-x-0.5"><polyline points="15 18 9 12 15 6" /></svg>
          Forsiden
        </Link>

        <div className="text-center mb-10 md:mb-14">
          <h1 className="scoreboard-header-v2 text-5xl md:text-7xl lg:text-8xl font-black leading-none tracking-tight">
            POENGOVERSIKT
          </h1>
          <p className="mt-4 text-lg md:text-xl text-white/60 font-medium tracking-wide">
            Hvem tar ledelsen?
          </p>
        </div>

        {error && (
          <p className="mb-6 rounded-md border border-red-400/30 bg-red-500/20 px-4 py-2 text-sm text-red-200 backdrop-blur-sm">{error}</p>
        )}

        {leaderboard.length === 0 ? (
          <div className="rounded-2xl bg-white/10 px-6 py-12 text-center text-white/50 backdrop-blur-sm border border-white/10">
            Ingen lag eller poeng registrert enda.
          </div>
        ) : (
          <LayoutGroup>
            <RaceTrack teams={leaderboard} />
          </LayoutGroup>
        )}

      </div>
    </main>
  )
}
