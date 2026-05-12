'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, LayoutGroup } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import type { Team, Score } from '@/types'
import { Podium, MobilePodium } from '@/components/scoreboard/Podium'
import { LeaderboardRow } from '@/components/scoreboard/LeaderboardRow'

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

  const top3 = leaderboard.slice(0, 3)
  const rest = leaderboard.slice(3)

  return (
    <main className="min-h-screen bg-[#d6e8f5] px-4 py-8 md:px-6 md:py-12 text-[#0b1525]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_20%,rgba(255,255,255,0.5),transparent)] pointer-events-none" />

      <div className="relative mx-auto max-w-5xl">
        <Link
          href="/"
          className="group fixed left-6 top-4 z-50 flex items-center gap-1.5 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-[#d8452e] backdrop-blur-sm transition-all hover:bg-white hover:shadow-md hover:gap-2.5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-x-0.5"><polyline points="15 18 9 12 15 6" /></svg>
          Forsiden
        </Link>

        <div className="text-center mb-8 md:mb-12">
          <h1
            className="scoreboard-header text-5xl md:text-7xl lg:text-8xl font-black leading-none tracking-tight text-transparent"
            style={{ WebkitTextStroke: '2px #d8452e' }}
          >
            Poengoversikt
          </h1>
          <p className="mt-3 text-lg md:text-xl text-[#44607a] font-medium">
            Hvem leder konkurransen?
          </p>
        </div>

        {error && (
          <p className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
        )}

        {leaderboard.length === 0 ? (
          <div className="rounded-2xl bg-white/60 px-6 py-12 text-center text-[#5f7387] backdrop-blur-sm">
            Ingen lag eller poeng registrert ennå.
          </div>
        ) : (
          <LayoutGroup>
            <Podium teams={top3} />
            <MobilePodium teams={top3} />

            {rest.length > 0 && (
              <div className="mt-6 md:mt-10 flex flex-col gap-2 md:gap-3">
                <AnimatePresence mode="popLayout">
                  {rest.map((team, i) => (
                    <LeaderboardRow
                      key={team.id}
                      id={team.id}
                      rank={i + 4}
                      name={team.name}
                      points={team.points}
                      delta={team.delta}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </LayoutGroup>
        )}

      </div>
    </main>
  )
}
