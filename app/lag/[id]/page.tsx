'use client'

import { useEffect, useState, useCallback, FormEvent } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import SunBackLink from '@/components/SunBackLink'
import { supabase } from '@/lib/supabase'
import type { Team, MarioKartMatch } from '@/types'

export default function TeamPage() {
  const { id } = useParams<{ id: string }>()

  const [team, setTeam] = useState<Team | null>(null)
  const [allTeams, setAllTeams] = useState<Team[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Name editing
  const [nameInput, setNameInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)

  // Shark tank popup
  const [showSharkTank, setShowSharkTank] = useState(false)

  // Mario Kart
  const [matches, setMatches] = useState<MarioKartMatch[]>([])
  const [selectedOpponent, setSelectedOpponent] = useState('')
  const [challenging, setChallenging] = useState(false)
  const [mkMsg, setMkMsg] = useState<string | null>(null)
  const [confirmChallenge, setConfirmChallenge] = useState<string | null>(null) // team id to confirm

  const teamName = useCallback(
    (teamId: string) => {
      const t = allTeams.find((t) => t.id === teamId)
      return t?.name || 'Ukjent lag'
    },
    [allTeams],
  )

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)

      const [
        { data: teamData, error: teamError },
        { data: teamsData },
        { data: matchesData },
      ] = await Promise.all([
        supabase.from('teams').select('*').eq('id', id).single(),
        supabase.from('teams').select('*').order('created_at'),
        supabase.from('mario_kart_matches').select('*'),
      ])

      if (teamError || !teamData) {
        setError('Fant ikke laget.')
        setLoading(false)
        return
      }

      setTeam(teamData as Team)
      setAllTeams((teamsData as Team[]) ?? [])
      setMatches((matchesData as MarioKartMatch[]) ?? [])
      setNameInput((teamData as Team).name)
      setLoading(false)
    }

    load()
  }, [id])

  // Realtime subscription for mario_kart_matches
  useEffect(() => {
    const channel = supabase
      .channel('mario_kart_matches_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'mario_kart_matches' },
        () => {
          supabase
            .from('mario_kart_matches')
            .select('*')
            .then(({ data }) => {
              if (data) setMatches(data as MarioKartMatch[])
            })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const groupNumber = allTeams.findIndex((t) => t.id === id) + 1
  const displayName = team?.name || `Gruppe ${groupNumber}`

  async function handleSaveName(e: FormEvent) {
    e.preventDefault()
    const trimmed = nameInput.trim()
    if (!trimmed || !team || trimmed === team.name) return

    setSaving(true)
    setSaveMsg(null)

    const { error: updateError } = await supabase
      .from('teams')
      .update({ name: trimmed })
      .eq('id', id)

    if (updateError) {
      setSaveMsg('Kunne ikke lagre navnet.')
      setSaving(false)
      return
    }

    setTeam({ ...team, name: trimmed })
    setSaveMsg('Navn lagret!')
    setSaving(false)
    setTimeout(() => setSaveMsg(null), 3000)
  }

  // --- Mario Kart helpers ---

  // All matches involving this team
  const myMatches = matches.filter(
    (m) => m.team_a_id === id || m.team_b_id === id,
  )

  // Teams already in a match with us (either direction)
  const matchedTeamIds = new Set(
    myMatches.flatMap((m) => [m.team_a_id, m.team_b_id]),
  )
  matchedTeamIds.delete(id)

  const availableOpponents = allTeams.filter(
    (t) => t.id !== id && !matchedTeamIds.has(t.id),
  )

  // Active matches (not yet confirmed) where we need to act
  const needsWinnerReport = myMatches.filter(
    (m) => !m.winner_team_id && !m.confirmed,
  )
  const needsOurConfirmation = myMatches.filter(
    (m) =>
      m.winner_team_id &&
      !m.confirmed &&
      m.reported_by !== id,
  )
  const waitingForTheirConfirmation = myMatches.filter(
    (m) =>
      m.winner_team_id &&
      !m.confirmed &&
      m.reported_by === id,
  )
  const confirmedMatches = myMatches.filter((m) => m.confirmed)

  function otherTeamId(match: MarioKartMatch) {
    return match.team_a_id === id ? match.team_b_id : match.team_a_id
  }


  async function handleReportWinner(matchId: string, winnerId: string) {
    await supabase
      .from('mario_kart_matches')
      .update({
        winner_team_id: winnerId,
        reported_by: id,
      })
      .eq('id', matchId)
  }

  async function handleConfirmResult(matchId: string, winnerTeamId: string) {
    const { error: confirmError } = await supabase
      .from('mario_kart_matches')
      .update({ confirmed: true, confirmed_at: new Date().toISOString() })
      .eq('id', matchId)

    if (confirmError) return

    // Award 2 points to winner
    let activityId: string
    const { data: existingActivity } = await supabase
      .from('activities')
      .select('id')
      .eq('name', 'Mario Kart')
      .single()

    if (existingActivity) {
      activityId = existingActivity.id
    } else {
      const { data: newActivity } = await supabase
        .from('activities')
        .insert({ name: 'Mario Kart' })
        .select('id')
        .single()
      if (!newActivity) return
      activityId = newActivity.id
    }

    await supabase.from('scores').insert({
      team_id: winnerTeamId,
      activity_id: activityId,
      points: 2,
    })
  }

  async function handleRejectResult(matchId: string) {
    // Clear the reported winner so they can re-report
    await supabase
      .from('mario_kart_matches')
      .update({ winner_team_id: null, reported_by: null })
      .eq('id', matchId)
  }

  async function handleDeleteChallenge(matchId: string) {
    await supabase.from('mario_kart_matches').delete().eq('id', matchId)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#d6e8f5] px-4 py-8 text-[#0b1525]">
        <div className="mx-auto max-w-2xl text-center text-[#5f7387]">Laster...</div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#d6e8f5] px-4 py-8 text-[#0b1525]">
        <div className="mx-auto max-w-2xl">
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
          <SunBackLink />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#d6e8f5] px-4 py-8 md:px-6 md:py-12 text-[#0b1525]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_20%,rgba(255,255,255,0.5),transparent)]" />

      <div className="relative mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <p className="text-sm font-medium text-[#44607a]">Gruppe {groupNumber}</p>
          <h1 className="mt-1 text-4xl font-black tracking-tight md:text-5xl">
            {displayName}
          </h1>
        </div>

        {/* Sett lagnavn */}
        {(() => {
          const hasDefaultName = !team?.name || /^(Gruppe|Lag)\s+\d+$/i.test(team.name)
          return (
            <section className="mb-8 rounded-2xl p-5 backdrop-blur-sm bg-white/60">
              {hasDefaultName && (
                <p className="mb-3 text-center text-lg font-bold text-[#d8452e]">
                  Hva heter laget deres? Skriv det inn her!
                </p>
              )}
              <form onSubmit={handleSaveName} className="flex gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Skriv inn lagnavn"
                  className={`flex-1 rounded-lg border bg-white px-3 py-2 text-sm ${hasDefaultName ? 'border-[#d8452e]/40 ring-2 ring-[#d8452e]/20' : 'border-zinc-300'}`}
                />
                <button
                  type="submit"
                  disabled={saving || nameInput.trim() === team?.name}
                  className="rounded-lg bg-[#d8452e] px-5 py-2 text-sm font-medium text-white hover:bg-[#b83a27] disabled:opacity-50"
                >
                  {saving ? 'Lagrer...' : 'Lagre'}
                </button>
              </form>
              {saveMsg && (
                <p className="mt-2 text-sm text-green-700">{saveMsg}</p>
              )}
            </section>
          )
        })()}

        {/* Top secret shark tank link */}
        {team?.locked && team.shark_tank_theme && (
          <section className="mb-8 text-center">
            <button
              type="button"
              onClick={() => setShowSharkTank(true)}
              className="w-full rounded-2xl bg-[#d8452e] px-6 py-5 text-white shadow-lg hover:bg-[#b83a27] transition-colors"
            >
              <p className="text-xs font-semibold uppercase tracking-widest opacity-75">Trykk her for å se oppgaven</p>
              <p className="mt-1 text-xl font-black">MVP før midnatt</p>
            </button>
          </section>
        )}

        {/* Timeplan / schedule */}
        {team?.locked && team.shark_tank_theme && groupNumber >= 1 && groupNumber <= 6 && (() => {
          // Schedule based on the rotation grid
          // Each round: which groups are at A1, A2, and A3
          const rounds: { time: string; a1?: number; a2?: number; isA3?: boolean }[] = [
            { time: '18:30–18:45', a1: 1, a2: 2 },
            { time: '18:50–19:05', a1: 3, a2: 4 },
            { time: '19:10–19:25', a1: 5, a2: 6 },
            { time: '19:30–19:45', a1: 2, a2: 1 },
            { time: '19:50–20:05', a1: 4, a2: 3 },
            { time: '20:10–20:25', a1: 6, a2: 5 },
            { time: '20:30–20:45', a1: 1, a2: 2, isA3: true },
            { time: '20:50–21:05', a1: 3, a2: 4, isA3: true },
            { time: '21:10–21:25', a1: 5, a2: 6, isA3: true },
          ]

          const g = groupNumber
          const slots = rounds.map((r) => {
            if (r.isA3 && (r.a1 === g || r.a2 === g)) return { time: r.time, label: 'Kongen befaler', slug: 'kongen-befaler', room: 'Videoloftet', type: 'busy' as const }
            if (r.a1 === g) return { time: r.time, label: 'Logikkolympics', slug: 'logikkolympics', room: 'Videoloftet', type: 'busy' as const }
            if (r.a2 === g) return { time: r.time, label: 'Sommelierlekene', slug: 'sommelierlekene', room: 'Sofaloftet', type: 'busy' as const }
            return { time: r.time, label: 'MVP før midnatt', slug: 'mvp-for-midnatt', room: 'Loftet', type: 'free' as const }
          })

          const freeCount = slots.filter(s => s.type === 'free').length
          const totalMinutes = freeCount * 15

          return (
            <section className="mb-8 rounded-2xl p-5 backdrop-blur-sm bg-white/60">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#44607a]">Timeplan</p>
              <h2 className="mt-1 mb-1 text-xl font-black">Kvelden i oversikt</h2>
              <p className="mb-2 text-sm text-[#5f7387]">
                Aktivitetene får dere vite mer om når dere kommer inn i rommet — bare møt opp til riktig tid!
              </p>
              <p className="mb-4 text-sm text-[#5f7387]">
                Resten av kvelden er MVP-tid. Dere har <strong className="text-[#0b1525]">{totalMinutes} minutter</strong> totalt.
                Bruk så mye tid dere vil på oppgaven — ellers er tiden deres til å ha det gøy!
              </p>

              <div className="space-y-1.5">
                {/* Intro */}
                <div className="flex items-center gap-3 rounded-lg bg-zinc-100 px-3 py-2 text-sm">
                  <span className="w-[5.5rem] shrink-0 font-medium text-[#44607a]">18:15–18:30</span>
                  <span className="text-[#5f7387]">Intro for alle</span>
                </div>

                {slots.map((slot, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                      slot.type === 'free'
                        ? 'bg-emerald-50 border border-emerald-200'
                        : 'bg-zinc-100'
                    }`}
                  >
                    <span className="w-[5.5rem] shrink-0 font-medium text-[#44607a]">{slot.time}</span>
                    <span className={
                      slot.type === 'free'
                        ? 'font-semibold text-emerald-800'
                        : 'text-[#5f7387]'
                    }>
                      {slot.slug ? (
                        <Link href={`/dagens-aktiviteter#${slot.slug}`} className="underline decoration-[#8da0b3] underline-offset-2 hover:text-[#0b1525] hover:decoration-[#0b1525]">
                          {slot.label}
                        </Link>
                      ) : (
                        slot.label
                      )}
                    </span>
                    <span className={`ml-auto text-xs ${
                      slot.type === 'free' ? 'text-emerald-600' : 'text-[#8da0b3]'
                    }`}>
                      {slot.room}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )
        })()}

        {/* Shark tank popup */}
        {showSharkTank && team?.shark_tank_theme && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setShowSharkTank(false)}>
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold mb-4"><span className="text-[#d8452e]">Deres tema er:</span> {team.shark_tank_theme}</h3>
              <p className="text-sm text-zinc-600 whitespace-pre-wrap mb-6">{team.shark_tank_task}</p>
              <button
                type="button"
                onClick={() => setShowSharkTank(false)}
                className="w-full rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-900"
              >
                Lukk
              </button>
            </div>
          </div>
        )}

        {/* Mario Kart challenge confirmation popup */}
        {confirmChallenge && (() => {
          const opponent = allTeams.find(t => t.id === confirmChallenge)
          if (!opponent) return null
          const opponentGroupNum = allTeams.findIndex(t => t.id === confirmChallenge) + 1
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setConfirmChallenge(null)}>
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold mb-2">Utfordre {opponent.name}?</h3>
                <p className="text-sm text-zinc-600 mb-3">
                  Sjekk at {opponent.name} har en friperiode nå, slik at de kan spille.
                </p>
                {opponent.members && (
                  <p className="text-sm text-zinc-500 mb-5">
                    Deltakere: <strong className="text-zinc-700">{opponent.members}</strong>
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      setConfirmChallenge(null)
                      setSelectedOpponent(confirmChallenge)
                      // Trigger challenge directly
                      setChallenging(true)
                      setMkMsg(null)
                      const { error: insertError } = await supabase
                        .from('mario_kart_matches')
                        .insert({ team_a_id: id, team_b_id: confirmChallenge })
                      if (insertError) {
                        setMkMsg('Kunne ikke opprette utfordring. Prøv igjen.')
                        setChallenging(false)
                        return
                      }
                      setSelectedOpponent('')
                      setMkMsg('Utfordring sendt!')
                      setChallenging(false)
                      setTimeout(() => setMkMsg(null), 4000)
                    }}
                    disabled={challenging}
                    className="flex-1 rounded-lg bg-[#d8452e] px-4 py-2 text-sm font-medium text-white hover:bg-[#b83a27] disabled:opacity-50"
                  >
                    Ja, utfordre!
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmChallenge(null)}
                    className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    Avbryt
                  </button>
                </div>
              </div>
            </div>
          )
        })()}

        {/* Mario Kart bonusoppgave */}
        <section className="mb-8 rounded-2xl p-5 backdrop-blur-sm bg-white/60">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#44607a]">Bonusoppgave</p>
          <h2 className="mt-1 mb-2 text-xl font-black">Mario Kart</h2>
          <p className="mb-4 text-sm text-[#5f7387]">
            Utfordre et annet lag til Mario Kart! Vinnerlaget får 2 bonuspoeng.
            Hvert lag-par kan bare spille én gang. Begge lag må bekrefte resultatet
            for at poengene skal telle.
            Mario Kart gjøres i MVP-tiden, når begge lag har en friperiode.
            Stasjonen er i <strong className="text-[#0b1525]">Stua</strong>.
          </p>

          {/* Challenge a team */}
          {availableOpponents.length > 0 ? (
            <div className="mb-4">
              <div className="flex gap-2 items-center">
                <select
                  value={selectedOpponent}
                  onChange={(e) => setSelectedOpponent(e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Velg motstander...</option>
                  {availableOpponents.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedOpponent) return
                    setConfirmChallenge(selectedOpponent)
                  }}
                  disabled={!selectedOpponent || challenging}
                  className="rounded-lg bg-[#d8452e] px-4 py-2 text-sm font-medium text-white hover:bg-[#b83a27] disabled:opacity-50 whitespace-nowrap"
                >
                  {challenging ? 'Sender...' : 'Utfordre!'}
                </button>
              </div>
              {mkMsg && (
                <p className="mt-2 text-sm text-green-700">{mkMsg}</p>
              )}
            </div>
          ) : myMatches.length > 0 ? (
            <p className="mb-4 text-sm text-[#5f7387]">
              Ingen flere lag å utfordre.
            </p>
          ) : null}

          {/* Matches awaiting winner report (both teams can report) */}
          {needsWinnerReport.map((m) => (
            <div
              key={m.id}
              className="mb-3 rounded-lg border border-purple-200 bg-purple-50 px-4 py-3"
            >
              <p className="mb-2 text-sm font-medium">
                Kamp mot {teamName(otherTeamId(m))}
              </p>
              <p className="mb-2 text-sm text-[#44607a]">
                Har dere spilt? Hvem vant?
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleReportWinner(m.id, id)}
                  className="rounded-lg bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700"
                >
                  Vi vant!
                </button>
                <button
                  type="button"
                  onClick={() => handleReportWinner(m.id, otherTeamId(m))}
                  className="rounded-lg bg-zinc-200 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-300"
                >
                  {teamName(otherTeamId(m))} vant
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteChallenge(m.id)}
                  className="ml-auto rounded-lg px-3 py-1.5 text-sm text-zinc-400 hover:text-red-500"
                  title="Avbryt utfordring"
                >
                  Avbryt
                </button>
              </div>
            </div>
          ))}

          {/* Waiting for the other team to confirm our report */}
          {waitingForTheirConfirmation.map((m) => (
            <div
              key={m.id}
              className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm"
            >
              Resultat rapportert: {m.winner_team_id === id ? 'dere' : teamName(m.winner_team_id!)} vant mot {m.winner_team_id === id ? teamName(otherTeamId(m)) : 'dere'}. Venter på bekreftelse fra {teamName(otherTeamId(m))}.
            </div>
          ))}

          {/* Other team reported a result — we need to confirm */}
          {needsOurConfirmation.map((m) => (
            <div
              key={m.id}
              className="mb-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3"
            >
              <p className="mb-2 text-sm">
                <strong>{teamName(otherTeamId(m))}</strong> rapporterer
                at <strong>{m.winner_team_id === id ? 'dere' : teamName(m.winner_team_id!)}</strong> vant
                — stemmer det?
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleConfirmResult(m.id, m.winner_team_id!)
                  }
                  className="rounded-lg bg-green-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-green-700"
                >
                  Bekreft
                </button>
                <button
                  type="button"
                  onClick={() => handleRejectResult(m.id)}
                  className="rounded-lg bg-zinc-200 px-4 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-300"
                >
                  Avvis
                </button>
              </div>
            </div>
          ))}

          {/* Confirmed matches */}
          {confirmedMatches.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-[#44607a]">
                Bekreftede kamper
              </h3>
              {confirmedMatches.map((m) => {
                const won = m.winner_team_id === id
                return (
                  <div
                    key={m.id}
                    className={`mb-2 rounded-lg px-4 py-2 text-sm ${won ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}
                  >
                    {won
                      ? `Dere vant mot ${teamName(otherTeamId(m))} (+2 poeng)`
                      : `${teamName(m.winner_team_id!)} vant mot dere`}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <SunBackLink />
        <Link
          href="/poengoversikt"
          aria-label="Gå til poengoversikt"
          className="group fixed z-50 block rotate-12"
          style={{ right: 'clamp(10px, 5vw, 72px)', top: 'clamp(60px, 10vh, 120px)' }}
        >
          <div className="relative overflow-hidden" style={{ width: 'clamp(135px, 20vw, 240px)', height: 'clamp(135px, 20vw, 240px)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/poengoversikt.png"
              alt=""
              aria-hidden="true"
              draggable={false}
              className="pointer-events-none block h-full w-full object-contain transition-opacity duration-150 group-hover:opacity-0"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/poengoversikt-hovered.png"
              alt=""
              aria-hidden="true"
              draggable={false}
              className="pointer-events-none absolute inset-0 block h-full w-full object-contain opacity-0 transition-opacity duration-150 group-hover:opacity-100"
            />
          </div>
        </Link>
      </div>
    </main>
  )
}
