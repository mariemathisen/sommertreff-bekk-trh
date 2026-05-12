'use client'

import { useEffect, useState, useCallback, FormEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Team, Activity, Subtask, Score } from '@/types'

type SubtaskDraft = {
  name: string
  max_points: string
  all_or_nothing: boolean
}

type SaveStatus = {
  key: string
  ok: boolean
}

export default function Admin() {
  const [gateOpen, setGateOpen] = useState(false)

  const [teams, setTeams] = useState<Team[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [draftTeams, setDraftTeams] = useState<{ draftId: number; name: string; members: string; theme: string; task: string }[]>([])
  const [newActivity, setNewActivity] = useState('')
  const [subtaskDrafts, setSubtaskDrafts] = useState<SubtaskDraft[]>([])
  const [status, setStatus] = useState<{ msg: string; ok: boolean } | null>(null)

  // Scoring state
  const [selectedActivity, setSelectedActivity] = useState('')
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [scores, setScores] = useState<Score[]>([])
  const [saveStatuses, setSaveStatuses] = useState<SaveStatus[]>([])

  // Editing state for saved teams (unlocked for editing)
  const [editingTeams, setEditingTeams] = useState<Record<string, { name: string; members: string; theme: string; task: string }>>({})

  // Flat scoring (activities without subtasks)
  const [flatScoreTeam, setFlatScoreTeam] = useState('')
  const [flatScorePoints, setFlatScorePoints] = useState('')

  // Overview table: all scores across all activities
  const [allScores, setAllScores] = useState<Score[]>([])

  // Inline editing in overview table
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')

  // All subtasks keyed by activity_id for the activity list
  const [allSubtasks, setAllSubtasks] = useState<Subtask[]>([])

  // Editing state for activities
  const [editingActivity, setEditingActivity] = useState<string | null>(null)
  const [editActivityName, setEditActivityName] = useState('')
  const [editSubtasks, setEditSubtasks] = useState<(Subtask & { _deleted?: boolean })[]>([])
  const [editNewSubtasks, setEditNewSubtasks] = useState<SubtaskDraft[]>([])

  const loadData = useCallback(async () => {
    const [{ data: t }, { data: a }, { data: s }, { data: st }] = await Promise.all([
      supabase.from('teams').select('*').order('created_at'),
      supabase.from('activities').select('*').order('name'),
      supabase.from('scores').select('*'),
      supabase.from('subtasks').select('*').order('sort_order'),
    ])
    if (t) setTeams(t as Team[])
    if (a) setActivities(a as Activity[])
    if (s) setAllScores(s as Score[])
    if (st) setAllSubtasks(st as Subtask[])
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Load subtasks and scores when activity changes
  useEffect(() => {
    if (!selectedActivity) {
      setSubtasks([])
      setScores([])
      return
    }
    async function loadActivityData() {
      const [{ data: st }, { data: sc }] = await Promise.all([
        supabase
          .from('subtasks')
          .select('*')
          .eq('activity_id', selectedActivity)
          .order('sort_order'),
        supabase
          .from('scores')
          .select('*')
          .eq('activity_id', selectedActivity),
      ])
      if (st) setSubtasks(st as Subtask[])
      if (sc) setScores(sc as Score[])
    }
    loadActivityData()
  }, [selectedActivity])

  function flash(msg: string, ok = true) {
    setStatus({ msg, ok })
    setTimeout(() => setStatus(null), 3000)
  }

  function flashCell(key: string, ok: boolean) {
    setSaveStatuses(prev => [...prev, { key, ok }])
    setTimeout(() => {
      setSaveStatuses(prev => prev.filter(s => s.key !== key))
    }, 1500)
  }

  // --- Teams ---
  function addDraftTeam() {
    const nextNumber = teams.length + draftTeams.length + 1
    setDraftTeams(prev => [...prev, { draftId: Date.now(), name: `Lag ${nextNumber}`, members: '', theme: '', task: '' }])
  }

  function updateDraftTeam(draftId: number, field: 'name' | 'members' | 'theme' | 'task', value: string) {
    setDraftTeams(prev => prev.map(d => d.draftId === draftId ? { ...d, [field]: value } : d))
  }

  function removeDraftTeam(draftId: number) {
    setDraftTeams(prev => prev.filter(d => d.draftId !== draftId))
  }

  async function confirmDraftTeam(draftId: number) {
    const draft = draftTeams.find(d => d.draftId === draftId)
    if (!draft) return
    if (!draft.name.trim() || !draft.members.trim() || !draft.theme.trim() || !draft.task.trim()) {
      flash('Fyll inn alle felt før du fullfører laget.', false)
      return
    }
    const { error } = await supabase.from('teams').insert({
      name: draft.name.trim(),
      members: draft.members.trim(),
      shark_tank_theme: draft.theme.trim(),
      shark_tank_task: draft.task.trim(),
      locked: true,
    })
    if (error) { flash('Feil: ' + error.message, false); return }
    setDraftTeams(prev => prev.filter(d => d.draftId !== draftId))
    flash(`${draft.name} er klar!`)
    loadData()
  }

  async function deleteTeam(teamId: string, name: string) {
    if (!confirm(`Slette «${name}»? Alle poeng knyttet til laget blir også slettet.`)) return
    const { error } = await supabase.from('teams').delete().eq('id', teamId)
    if (error) { flash('Feil: ' + error.message, false); return }
    flash('Lag slettet!')
    loadData()
  }

  function startEditingTeam(t: Team) {
    setEditingTeams(prev => ({
      ...prev,
      [t.id]: { name: t.name, members: t.members, theme: t.shark_tank_theme ?? '', task: t.shark_tank_task ?? '' },
    }))
  }

  function updateEditingTeam(teamId: string, field: 'name' | 'members' | 'theme' | 'task', value: string) {
    setEditingTeams(prev => ({
      ...prev,
      [teamId]: { ...prev[teamId], [field]: value },
    }))
  }

  function cancelEditingTeam(teamId: string) {
    setEditingTeams(prev => {
      const next = { ...prev }
      delete next[teamId]
      return next
    })
  }

  async function saveEditingTeam(teamId: string) {
    const edit = editingTeams[teamId]
    if (!edit) return
    if (!edit.name.trim() || !edit.members.trim() || !edit.theme.trim() || !edit.task.trim()) {
      flash('Fyll inn alle felt før du fullfører laget.', false)
      return
    }
    const { error } = await supabase.from('teams').update({
      name: edit.name.trim(),
      members: edit.members.trim(),
      shark_tank_theme: edit.theme.trim(),
      shark_tank_task: edit.task.trim(),
      locked: true,
    }).eq('id', teamId)
    if (error) { flash('Feil: ' + error.message, false); return }
    cancelEditingTeam(teamId)
    flash('Lag oppdatert!')
    loadData()
  }

  // --- Activities with subtasks ---
  function addSubtaskDraft() {
    setSubtaskDrafts(prev => [...prev, { name: '', max_points: '', all_or_nothing: false }])
  }

  function updateSubtaskDraft(index: number, field: keyof SubtaskDraft, value: string | boolean) {
    setSubtaskDrafts(prev => prev.map((d, i) => i === index ? { ...d, [field]: value } : d))
  }

  function removeSubtaskDraft(index: number) {
    setSubtaskDrafts(prev => prev.filter((_, i) => i !== index))
  }

  async function addActivity(e: FormEvent) {
    e.preventDefault()
    if (!newActivity.trim()) return

    // Validate subtask drafts if any
    for (const d of subtaskDrafts) {
      const pts = parseInt(d.max_points, 10)
      if (!d.name.trim() || isNaN(pts) || pts <= 0) {
        flash('Fyll inn alle oppgavefelt korrekt (navn og maks poeng > 0).', false)
        return
      }
    }

    const { data: activity, error } = await supabase
      .from('activities')
      .insert({ name: newActivity.trim() })
      .select()
      .single()
    if (error || !activity) { flash('Feil: ' + (error?.message ?? 'Ukjent feil'), false); return }

    // Insert subtasks if any
    if (subtaskDrafts.length > 0) {
      const subtaskRows = subtaskDrafts.map((d, i) => ({
        activity_id: activity.id,
        name: d.name.trim(),
        max_points: parseInt(d.max_points, 10),
        sort_order: i,
        all_or_nothing: d.all_or_nothing,
      }))
      const { error: stError } = await supabase.from('subtasks').insert(subtaskRows)
      if (stError) { flash('Aktivitet opprettet, men feil med oppgaver: ' + stError.message, false); return }
    }

    setNewActivity('')
    setSubtaskDrafts([])
    flash('Aktivitet lagt til!')
    loadData()
  }

  // --- Delete activity ---
  async function deleteActivity(id: string, name: string) {
    if (!confirm(`Slette «${name}»? Alle oppgaver og poeng knyttet til aktiviteten blir også slettet.`)) return
    const { error } = await supabase.from('activities').delete().eq('id', id)
    if (error) { flash('Feil: ' + error.message, false); return }
    if (selectedActivity === id) setSelectedActivity('')
    setAllScores(prev => prev.filter(s => s.activity_id !== id))
    flash('Aktivitet slettet!')
    loadData()
  }

  // --- Edit activity ---
  function startEditActivity(a: Activity) {
    setEditingActivity(a.id)
    setEditActivityName(a.name)
    setEditSubtasks(allSubtasks.filter(st => st.activity_id === a.id))
    setEditNewSubtasks([])
  }

  function cancelEditActivity() {
    setEditingActivity(null)
    setEditActivityName('')
    setEditSubtasks([])
    setEditNewSubtasks([])
  }

  async function saveEditActivity() {
    if (!editingActivity || !editActivityName.trim()) return

    // Update activity name
    const { error: nameErr } = await supabase
      .from('activities')
      .update({ name: editActivityName.trim() })
      .eq('id', editingActivity)
    if (nameErr) { flash('Feil: ' + nameErr.message, false); return }

    // Delete removed subtasks
    const deleted = editSubtasks.filter(st => st._deleted)
    for (const st of deleted) {
      await supabase.from('subtasks').delete().eq('id', st.id)
    }

    // Update existing subtasks
    const kept = editSubtasks.filter(st => !st._deleted)
    for (const st of kept) {
      await supabase.from('subtasks').update({
        name: st.name,
        max_points: st.max_points,
        all_or_nothing: st.all_or_nothing,
        sort_order: st.sort_order,
      }).eq('id', st.id)
    }

    // Insert new subtasks
    if (editNewSubtasks.length > 0) {
      const newRows = editNewSubtasks
        .filter(d => d.name.trim() && parseInt(d.max_points, 10) > 0)
        .map((d, i) => ({
          activity_id: editingActivity,
          name: d.name.trim(),
          max_points: parseInt(d.max_points, 10),
          sort_order: kept.length + i,
          all_or_nothing: d.all_or_nothing,
        }))
      if (newRows.length > 0) {
        const { error: stErr } = await supabase.from('subtasks').insert(newRows)
        if (stErr) { flash('Feil med nye oppgaver: ' + stErr.message, false); return }
      }
    }

    cancelEditActivity()
    flash('Aktivitet oppdatert!')
    loadData()
  }

  // --- Scoring ---
  function getScore(teamId: string, subtaskId: string): number | undefined {
    const s = scores.find(sc => sc.team_id === teamId && sc.subtask_id === subtaskId)
    return s?.points
  }

  async function upsertScore(teamId: string, subtaskId: string, points: number) {
    const cellKey = `${teamId}-${subtaskId}`

    // Find existing score for this team+subtask
    const existing = scores.find(s => s.team_id === teamId && s.subtask_id === subtaskId)

    let result: { data: Score[] | null; error: { message: string } | null }

    if (existing) {
      result = await supabase
        .from('scores')
        .update({ points })
        .eq('id', existing.id)
        .select() as { data: Score[] | null; error: { message: string } | null }
    } else {
      result = await supabase
        .from('scores')
        .insert({
          team_id: teamId,
          activity_id: selectedActivity,
          subtask_id: subtaskId,
          points,
        })
        .select() as { data: Score[] | null; error: { message: string } | null }
    }

    if (result.error) {
      flashCell(cellKey, false)
      return
    }

    flashCell(cellKey, true)

    if (result.data && result.data[0]) {
      const newScore = result.data[0]
      setScores(prev => {
        const filtered = prev.filter(
          s => !(s.team_id === teamId && s.subtask_id === subtaskId)
        )
        return [...filtered, newScore]
      })
      setAllScores(prev => {
        const filtered = prev.filter(
          s => !(s.team_id === teamId && s.subtask_id === subtaskId)
        )
        return [...filtered, newScore]
      })
    }
  }

  async function addFlatScore(e: FormEvent) {
    e.preventDefault()
    const points = parseInt(flatScorePoints, 10)
    if (!flatScoreTeam || isNaN(points) || points < 0) {
      flash('Fyll inn alle felt korrekt.', false)
      return
    }
    const { data, error } = await supabase.from('scores').insert({
      team_id: flatScoreTeam,
      activity_id: selectedActivity,
      points,
    }).select()
    if (error) { flash('Feil: ' + error.message, false); return }
    if (data && data[0]) {
      setAllScores(prev => [...prev, data[0] as Score])
    }
    setFlatScorePoints('')
    const team = teams.find(t => t.id === flatScoreTeam)
    flash(`${points} poeng til ${team?.name}`)
  }

  function teamTotal(teamId: string): number {
    return scores
      .filter(s => s.team_id === teamId)
      .reduce((sum, s) => sum + s.points, 0)
  }

  const hasSubtasks = subtasks.length > 0

  function activityTotal(teamId: string, activityId: string): number {
    return allScores
      .filter(s => s.team_id === teamId && s.activity_id === activityId)
      .reduce((sum, s) => sum + s.points, 0)
  }

  function grandTotal(teamId: string): number {
    return allScores
      .filter(s => s.team_id === teamId)
      .reduce((sum, s) => sum + s.points, 0)
  }

  async function saveOverrideScore(teamId: string, activityId: string, value: string) {
    const cellKey = `${teamId}-${activityId}`
    const pts = parseInt(value, 10)
    if (isNaN(pts)) {
      flashCell(cellKey, false)
      setEditingCell(null)
      return
    }
    // Check if value actually changed
    const current = activityTotal(teamId, activityId)
    if (pts === current) {
      setEditingCell(null)
      return
    }
    // Delete existing scores for this team+activity, then insert new one
    const { error: delErr } = await supabase
      .from('scores')
      .delete()
      .eq('team_id', teamId)
      .eq('activity_id', activityId)
    if (delErr) {
      flashCell(cellKey, false)
      setEditingCell(null)
      return
    }
    const { data: inserted, error: insErr } = await supabase
      .from('scores')
      .insert({ team_id: teamId, activity_id: activityId, points: pts })
      .select()
      .single()
    if (insErr || !inserted) {
      flashCell(cellKey, false)
      setEditingCell(null)
      return
    }
    // Update local state
    setAllScores(prev => [
      ...prev.filter(s => !(s.team_id === teamId && s.activity_id === activityId)),
      inserted as Score,
    ])
    flashCell(cellKey, true)
    setEditingCell(null)
  }

  if (!gateOpen) {
    return (
      <div className="min-h-screen bg-[#d6e8f5] flex flex-col items-center justify-center px-4">
        <Image
          src="/side-eye-dog-suspicious-look.gif"
          alt="Suspicious dog"
          width={320}
          height={320}
          unoptimized
          className="rounded-xl mb-8"
        />
        <h1 className="text-xl font-semibold text-zinc-800 mb-6 text-center">
          Skal du egentlig ha tilgang til denne siden?
        </h1>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={() => setGateOpen(true)}
            className="bg-zinc-800 text-white rounded-lg px-4 py-3 text-sm font-medium hover:bg-zinc-900 transition-colors"
          >
            Ja, jeg er Anne Marie
          </button>
          <button
            onClick={() => setGateOpen(true)}
            className="bg-zinc-800 text-white rounded-lg px-4 py-3 text-sm font-medium hover:bg-zinc-900 transition-colors"
          >
            Ja, jeg er Tale
          </button>
          <Link
            href="/"
            className="text-center border border-zinc-300 bg-white text-zinc-600 rounded-lg px-4 py-3 text-sm font-medium hover:bg-zinc-50 transition-colors"
          >
            Nvm!
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#d6e8f5] px-4 py-10">
      <div className="max-w-3xl mx-auto space-y-10">

        <Link
          href="/"
          className="group fixed left-6 top-4 z-50 flex items-center gap-1.5 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-[#d8452e] backdrop-blur-sm transition-all hover:bg-white hover:shadow-md hover:gap-2.5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:-translate-x-0.5"><polyline points="15 18 9 12 15 6" /></svg>
          Forsiden
        </Link>

        <h1 className="text-2xl font-bold text-zinc-900">Admin</h1>

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

        {/* ── Poengoversikt ──────────────────────────────────── */}
        {teams.length > 0 && activities.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-zinc-800">Poengoversikt</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-zinc-100">
                    <th className="text-left px-3 py-2 font-medium text-zinc-700 border border-zinc-200">Lag</th>
                    {activities.map(a => (
                      <th key={a.id} className="text-center px-3 py-2 font-medium text-zinc-700 border border-zinc-200">
                        {a.name}
                      </th>
                    ))}
                    <th className="text-center px-3 py-2 font-semibold text-zinc-800 border border-zinc-200 bg-zinc-200">
                      Totalt
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map(team => (
                    <tr key={team.id} className="even:bg-white odd:bg-zinc-50">
                      <td className="px-3 py-2 font-medium text-zinc-800 border border-zinc-200">{team.name}</td>
                      {activities.map(a => {
                        const cellKey = `${team.id}-${a.id}`
                        const pts = activityTotal(team.id, a.id)
                        const cellStatus = saveStatuses.find(s => s.key === cellKey)
                        const isEditing = editingCell === cellKey
                        return (
                          <td
                            key={a.id}
                            className={`px-3 py-2 text-center border border-zinc-200 cursor-pointer transition-colors ${
                              cellStatus ? (cellStatus.ok ? 'bg-green-100' : 'bg-red-100') :
                              isEditing ? 'bg-blue-50' :
                              pts > 0 ? 'text-zinc-800' : 'text-zinc-300'
                            }`}
                            onClick={() => {
                              if (!isEditing) {
                                setEditingCell(cellKey)
                                setEditingValue(pts > 0 ? String(pts) : '')
                              }
                            }}
                          >
                            {isEditing ? (
                              <input
                                type="number"
                                autoFocus
                                value={editingValue}
                                onChange={e => setEditingValue(e.target.value)}
                                onBlur={() => saveOverrideScore(team.id, a.id, editingValue)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') saveOverrideScore(team.id, a.id, editingValue)
                                  if (e.key === 'Escape') setEditingCell(null)
                                }}
                                className="w-16 text-center border border-zinc-300 rounded px-1 py-0.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                              />
                            ) : (
                              <>
                                {pts > 0 ? pts : '–'}
                                {cellStatus && (cellStatus.ok ? ' ✓' : ' !')}
                              </>
                            )}
                          </td>
                        )
                      })}
                      <td className="px-3 py-2 text-center font-semibold text-zinc-800 border border-zinc-200 bg-zinc-100">
                        {grandTotal(team.id)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <div className="border-t border-zinc-200" />

        {/* ── Registrer poeng ─────────────────────────────────── */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-800">Registrer poeng</h2>

          <select
            value={selectedActivity}
            onChange={e => setSelectedActivity(e.target.value)}
            className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="">Velg aktivitet</option>
            {activities.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>

          {selectedActivity && hasSubtasks && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-zinc-100">
                    <th className="text-left px-3 py-2 font-medium text-zinc-700 border border-zinc-200">Lag</th>
                    {subtasks.map(st => (
                      <th key={st.id} className="text-center px-3 py-2 font-medium text-zinc-700 border border-zinc-200">
                        <div>{st.name}</div>
                        <div className="text-xs font-normal text-zinc-500">
                          {st.all_or_nothing ? `0 eller ${st.max_points}` : `maks ${st.max_points}`}
                        </div>
                      </th>
                    ))}
                    <th className="text-center px-3 py-2 font-medium text-zinc-700 border border-zinc-200">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map(team => (
                    <tr key={team.id} className="even:bg-white odd:bg-zinc-50">
                      <td className="px-3 py-2 font-medium text-zinc-800 border border-zinc-200">{team.name}</td>
                      {subtasks.map(st => {
                        const cellKey = `${team.id}-${st.id}`
                        const cellStatus = saveStatuses.find(s => s.key === cellKey)
                        const currentVal = getScore(team.id, st.id)

                        return (
                          <td key={st.id} className="px-2 py-1 border border-zinc-200 text-center relative">
                            {st.all_or_nothing ? (
                              <button
                                type="button"
                                onClick={() => {
                                  const newVal = currentVal === st.max_points ? 0 : st.max_points
                                  upsertScore(team.id, st.id, newVal)
                                }}
                                className={`w-full px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                                  currentVal === st.max_points
                                    ? 'bg-green-600 text-white'
                                    : 'bg-zinc-200 text-zinc-600'
                                }`}
                              >
                                {currentVal === st.max_points ? st.max_points : 0}
                              </button>
                            ) : (
                              <input
                                type="number"
                                min={0}
                                max={st.max_points}
                                defaultValue={currentVal ?? ''}
                                onBlur={e => {
                                  const val = parseInt(e.target.value, 10)
                                  if (isNaN(val)) return
                                  const clamped = Math.max(0, Math.min(st.max_points, val))
                                  if (clamped !== val) e.target.value = String(clamped)
                                  if (clamped !== currentVal) {
                                    upsertScore(team.id, st.id, clamped)
                                  }
                                }}
                                className="w-16 text-center border border-zinc-300 rounded px-2 py-1.5 text-sm"
                              />
                            )}
                            {cellStatus && (
                              <span className={`absolute -top-1 -right-1 text-xs px-1 rounded ${
                                cellStatus.ok ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                              }`}>
                                {cellStatus.ok ? '✓' : '!'}
                              </span>
                            )}
                          </td>
                        )
                      })}
                      <td className="px-3 py-2 text-center font-semibold text-zinc-800 border border-zinc-200">
                        {teamTotal(team.id)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedActivity && !hasSubtasks && (
            <form onSubmit={addFlatScore} className="flex flex-col gap-3">
              <select
                value={flatScoreTeam}
                onChange={e => setFlatScoreTeam(e.target.value)}
                className="border border-zinc-300 rounded-lg px-3 py-2 text-sm bg-white"
              >
                <option value="">Velg lag</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  value={flatScorePoints}
                  onChange={e => setFlatScorePoints(e.target.value)}
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
          )}
        </section>

        <div className="border-t border-zinc-200" />

        {/* ── Lag ───────────────────────────────────────────── */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-800">Lag</h2>

          {(teams.length > 0 || draftTeams.length > 0) && (
            <div className="space-y-3">
              {/* Saved teams */}
              {teams.map(t => {
                const isEditing = t.id in editingTeams
                const edit = editingTeams[t.id]
                return (
                  <div key={t.id} className={`rounded-lg px-4 py-3 space-y-2 ${isEditing ? 'border border-zinc-200 bg-white' : 'border border-green-300 bg-green-50'}`}>
                    {isEditing ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Rediger lag</span>
                          <button type="button" onClick={() => cancelEditingTeam(t.id)} className="text-zinc-400 hover:text-zinc-600 text-xs">Avbryt</button>
                        </div>
                        <input
                          type="text"
                          value={edit.name}
                          onChange={e => updateEditingTeam(t.id, 'name', e.target.value)}
                          placeholder="Lagnavn"
                          className="w-full border border-zinc-300 rounded px-2 py-1.5 text-sm"
                        />
                        <input
                          type="text"
                          value={edit.members}
                          onChange={e => updateEditingTeam(t.id, 'members', e.target.value)}
                          placeholder="Deltakere (f.eks. Ola, Kari, Per)"
                          className="w-full border border-zinc-300 rounded px-2 py-1.5 text-sm"
                        />
                        <input
                          type="text"
                          value={edit.theme}
                          onChange={e => updateEditingTeam(t.id, 'theme', e.target.value)}
                          placeholder="Shark Tank-tema"
                          className="w-full border border-zinc-300 rounded px-2 py-1.5 text-sm"
                        />
                        <textarea
                          value={edit.task}
                          onChange={e => updateEditingTeam(t.id, 'task', e.target.value)}
                          placeholder="Oppgavebeskrivelse"
                          rows={2}
                          className="w-full border border-zinc-300 rounded px-2 py-1.5 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => saveEditingTeam(t.id)}
                          className="rounded bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
                        >
                          Ferdig
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-zinc-800">{t.name}</span>
                            <span className="text-xs text-green-600 font-medium">Klar</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <button type="button" onClick={() => startEditingTeam(t)} className="text-blue-500 hover:text-blue-700 text-xs">Rediger lag</button>
                            <button type="button" onClick={() => deleteTeam(t.id, t.name)} className="text-red-400 hover:text-red-600 text-xs">Slett</button>
                          </div>
                        </div>
                        {t.members && <p className="text-sm text-zinc-500">{t.members}</p>}
                        {t.shark_tank_theme && (
                          <div className="border-t border-green-200 pt-2 space-y-1">
                            <div className="text-sm"><span className="font-medium text-zinc-700">Tema:</span> {t.shark_tank_theme}</div>
                            <div className="text-sm"><span className="font-medium text-zinc-700">Oppgave:</span> {t.shark_tank_task}</div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })}

              {/* Draft teams — not yet saved */}
              {draftTeams.map(d => (
                <div key={d.draftId} className="rounded-lg border border-zinc-200 bg-white px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-zinc-800">{d.name}</span>
                    <button
                      type="button"
                      onClick={() => removeDraftTeam(d.draftId)}
                      className="text-red-400 hover:text-red-600 text-xs"
                    >
                      Fjern
                    </button>
                  </div>
                  <input
                    type="text"
                    value={d.members}
                    onChange={e => updateDraftTeam(d.draftId, 'members', e.target.value)}
                    placeholder="Deltakere (f.eks. Ola, Kari, Per)"
                    className="w-full border border-zinc-200 rounded px-3 py-1.5 text-sm text-zinc-600"
                  />
                  <input
                    type="text"
                    value={d.theme}
                    onChange={e => updateDraftTeam(d.draftId, 'theme', e.target.value)}
                    placeholder="Shark Tank-tema"
                    className="w-full border border-zinc-200 rounded px-3 py-1.5 text-sm text-zinc-600"
                  />
                  <textarea
                    value={d.task}
                    onChange={e => updateDraftTeam(d.draftId, 'task', e.target.value)}
                    placeholder="Oppgavebeskrivelse"
                    rows={2}
                    className="w-full border border-zinc-200 rounded px-3 py-1.5 text-sm text-zinc-600"
                  />
                  <button
                    type="button"
                    onClick={() => confirmDraftTeam(d.draftId)}
                    className="rounded bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
                  >
                    Ferdig
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={addDraftTeam}
            className="bg-zinc-800 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-zinc-900"
          >
            + Opprett nytt lag
          </button>
        </section>

        {/* ── Legg til aktivitet ──────────────────────────────── */}
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-800">Legg til aktivitet</h2>
          <form onSubmit={addActivity} className="space-y-3">
            <div className="flex gap-2">
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
            </div>

            {/* Subtask drafts */}
            {subtaskDrafts.length > 0 && (
              <div className="space-y-2 pl-2 border-l-2 border-zinc-300">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Oppgaver</p>
                {subtaskDrafts.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={d.name}
                      onChange={e => updateSubtaskDraft(i, 'name', e.target.value)}
                      placeholder={`Oppgave ${i + 1}`}
                      className="flex-1 border border-zinc-300 rounded px-2 py-1.5 text-sm"
                    />
                    <input
                      type="number"
                      min="1"
                      value={d.max_points}
                      onChange={e => updateSubtaskDraft(i, 'max_points', e.target.value)}
                      placeholder="Maks"
                      className="w-20 border border-zinc-300 rounded px-2 py-1.5 text-sm"
                    />
                    <label className="flex items-center gap-1 text-xs text-zinc-600 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={d.all_or_nothing}
                        onChange={e => updateSubtaskDraft(i, 'all_or_nothing', e.target.checked)}
                      />
                      0/{d.max_points || '?'}
                    </label>
                    <button
                      type="button"
                      onClick={() => removeSubtaskDraft(i)}
                      className="text-red-400 hover:text-red-600 text-sm px-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={addSubtaskDraft}
              className="text-sm text-blue-600 hover:underline"
            >
              + Legg til oppgave
            </button>
          </form>

          {activities.length > 0 && (
            <div className="space-y-3">
              {activities.map(a => {
                const aSubs = allSubtasks.filter(st => st.activity_id === a.id)
                const isEditing = editingActivity === a.id

                if (isEditing) {
                  return (
                    <div key={a.id} className="rounded-lg border border-blue-300 bg-blue-50 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">Rediger aktivitet</span>
                        <button type="button" onClick={cancelEditActivity} className="text-zinc-400 hover:text-zinc-600 text-xs">Avbryt</button>
                      </div>
                      <input
                        type="text"
                        value={editActivityName}
                        onChange={e => setEditActivityName(e.target.value)}
                        className="w-full border border-zinc-300 rounded px-3 py-2 text-sm font-medium"
                      />

                      {editSubtasks.length > 0 && (
                        <div className="space-y-2 pl-3 border-l-2 border-blue-200">
                          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Oppgaver</p>
                          {editSubtasks.map((st, i) => (
                            <div key={st.id} className={`flex items-center gap-2 ${st._deleted ? 'opacity-30' : ''}`}>
                              <input
                                value={st.name}
                                onChange={e => setEditSubtasks(prev => prev.map((s, j) => j === i ? { ...s, name: e.target.value } : s))}
                                disabled={st._deleted}
                                className="flex-1 border border-zinc-300 rounded px-2 py-1.5 text-sm"
                              />
                              <input
                                type="number"
                                min="1"
                                value={st.max_points}
                                onChange={e => setEditSubtasks(prev => prev.map((s, j) => j === i ? { ...s, max_points: parseInt(e.target.value, 10) || 0 } : s))}
                                disabled={st._deleted}
                                className="w-20 border border-zinc-300 rounded px-2 py-1.5 text-sm"
                              />
                              <label className="flex items-center gap-1 text-xs text-zinc-600 whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  checked={st.all_or_nothing}
                                  onChange={e => setEditSubtasks(prev => prev.map((s, j) => j === i ? { ...s, all_or_nothing: e.target.checked } : s))}
                                  disabled={st._deleted}
                                />
                                0/{st.max_points}
                              </label>
                              <button
                                type="button"
                                onClick={() => setEditSubtasks(prev => prev.map((s, j) => j === i ? { ...s, _deleted: !s._deleted } : s))}
                                className={`text-xs px-1 ${st._deleted ? 'text-blue-500 hover:text-blue-700' : 'text-red-400 hover:text-red-600'}`}
                              >
                                {st._deleted ? 'Angre' : '×'}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {editNewSubtasks.length > 0 && (
                        <div className="space-y-2 pl-3 border-l-2 border-green-200">
                          <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Nye oppgaver</p>
                          {editNewSubtasks.map((d, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <input
                                value={d.name}
                                onChange={e => setEditNewSubtasks(prev => prev.map((s, j) => j === i ? { ...s, name: e.target.value } : s))}
                                placeholder={`Oppgave ${i + 1}`}
                                className="flex-1 border border-zinc-300 rounded px-2 py-1.5 text-sm"
                              />
                              <input
                                type="number"
                                min="1"
                                value={d.max_points}
                                onChange={e => setEditNewSubtasks(prev => prev.map((s, j) => j === i ? { ...s, max_points: e.target.value } : s))}
                                placeholder="Maks"
                                className="w-20 border border-zinc-300 rounded px-2 py-1.5 text-sm"
                              />
                              <label className="flex items-center gap-1 text-xs text-zinc-600 whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  checked={d.all_or_nothing}
                                  onChange={e => setEditNewSubtasks(prev => prev.map((s, j) => j === i ? { ...s, all_or_nothing: e.target.checked } : s))}
                                />
                                0/{d.max_points || '?'}
                              </label>
                              <button
                                type="button"
                                onClick={() => setEditNewSubtasks(prev => prev.filter((_, j) => j !== i))}
                                className="text-red-400 hover:text-red-600 text-sm px-1"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setEditNewSubtasks(prev => [...prev, { name: '', max_points: '', all_or_nothing: false }])}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          + Legg til oppgave
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={saveEditActivity}
                        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                      >
                        Lagre endringer
                      </button>
                    </div>
                  )
                }

                return (
                  <div key={a.id} className="rounded-lg border border-zinc-200 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-zinc-800">{a.name}</h3>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => startEditActivity(a)} className="text-blue-500 hover:text-blue-700 text-xs">Rediger</button>
                        <button type="button" onClick={() => deleteActivity(a.id, a.name)} className="text-red-400 hover:text-red-600 text-xs">Slett</button>
                      </div>
                    </div>
                    {aSubs.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {aSubs.map(st => (
                          <div key={st.id} className="flex items-center gap-2 text-xs text-zinc-500 pl-3 border-l-2 border-zinc-100">
                            <span className="flex-1">{st.name}</span>
                            <span className="tabular-nums text-zinc-400">maks {st.max_points}p</span>
                            {st.all_or_nothing && <span className="text-amber-500 font-medium">0/{st.max_points}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                    {aSubs.length === 0 && (
                      <p className="mt-1 text-xs text-zinc-400">Ingen oppgaver — flat poenggiving</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
