export type Team = {
  id: string
  name: string
  created_at: string
}

export type Activity = {
  id: string
  name: string
  created_at: string
}

export type Score = {
  id: string
  team_id: string
  activity_id: string
  points: number
  created_at: string
}
