export type Team = {
  id: string
  name: string
  members: string
  shark_tank_theme: string | null
  shark_tank_task: string | null
  locked: boolean
  created_at: string
}

export type Activity = {
  id: string
  name: string
  created_at: string
}

export type Subtask = {
  id: string
  activity_id: string
  name: string
  max_points: number
  sort_order: number
  all_or_nothing: boolean
}

export type Score = {
  id: string
  team_id: string
  activity_id: string
  subtask_id?: string | null
  points: number
  created_at: string
}

export type MarioKartMatch = {
  id: string
  team_a_id: string
  team_b_id: string
  winner_team_id: string | null
  reported_by: string | null
  confirmed: boolean
  created_at: string
  confirmed_at: string | null
}
