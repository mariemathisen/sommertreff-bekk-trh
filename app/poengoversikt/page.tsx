'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Team, Score } from '@/types'

type TeamWithPoints = Team & {
  points: number
}

export default function PoengoversiktPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [scores, setScores] = useState<Score[]>([])
  const [error, setError] = useState<string | null>(null)

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

    return teams
      .map((team) => ({
        ...team,
        points: pointsByTeamId[team.id] ?? 0,
      }))
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points
        return a.name.localeCompare(b.name, 'nb')
      })
  }, [teams, scores])

  return (
    <main className="min-h-screen bg-[#d6e8f5] px-6 py-12 text-[#0b1525]">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Poengoversikt</h1>

        {error && (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
        )}

        <div className="mt-6 overflow-hidden rounded-xl border border-[#b7ccdd] bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#edf4fa] text-xs uppercase tracking-wide text-[#44607a]">
              <tr>
                <th className="px-4 py-3">Plass</th>
                <th className="px-4 py-3">Lag</th>
                <th className="px-4 py-3 text-right">Poeng</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((team, index) => (
                <tr key={team.id} className="border-t border-[#edf4fa]">
                  <td className="px-4 py-3 font-semibold">{index + 1}</td>
                  <td className="px-4 py-3">{team.name}</td>
                  <td className="px-4 py-3 text-right font-bold">{team.points}</td>
                </tr>
              ))}
              {leaderboard.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-[#5f7387]">
                    Ingen lag eller poeng registrert ennå.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Link href="/" className="mt-8 inline-block text-sm font-semibold text-[#d8452e] hover:underline">
          Tilbake til forsiden
        </Link>
      </div>
    </main>
  )
}
