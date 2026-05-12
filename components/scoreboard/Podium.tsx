'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { AnimatedScore } from './AnimatedScore'

type PodiumTeam = {
  id: string
  name: string
  points: number
  delta?: number
}

type PodiumProps = {
  teams: PodiumTeam[]
}

const PODIUM_CONFIG = [
  { place: 2, order: 'order-1', height: 'h-40 md:h-52', color: '#7396dc', label: '2', barBg: 'bg-[#7396dc]' },
  { place: 1, order: 'order-2', height: 'h-56 md:h-72', color: '#e2b347', label: '1', barBg: 'bg-[#e2b347]' },
  { place: 3, order: 'order-3', height: 'h-28 md:h-40', color: '#d85c34', label: '3', barBg: 'bg-[#d85c34]' },
] as const

export function Podium({ teams }: PodiumProps) {
  if (teams.length === 0) return null

  const podiumTeams = [teams[1], teams[0], teams[2]].filter(Boolean)

  return (
    <div className="hidden md:flex items-end justify-center gap-3 md:gap-6 px-4">
      <AnimatePresence mode="popLayout">
        {podiumTeams.map((team, i) => {
          const config = PODIUM_CONFIG[i]
          if (!team) return null

          return (
            <motion.div
              key={team.id}
              layoutId={`podium-${team.id}`}
              className={`flex flex-col items-center ${config.order}`}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 120, damping: 20, mass: 0.8 }}
              style={{ flex: config.place === 1 ? '1.2' : '1' }}
            >
              <div className="mb-3 text-center">
                <p className="text-lg md:text-2xl font-bold text-[#0b1525] truncate max-w-[200px]">
                  {team.name}
                </p>
                <div className="text-3xl md:text-5xl font-black" style={{ color: config.color }}>
                  <AnimatedScore value={team.points} />
                </div>
                {team.delta != null && team.delta > 0 && (
                  <motion.span
                    className="text-sm md:text-base font-bold text-green-600"
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 0, y: -10 }}
                    transition={{ duration: 2, delay: 1 }}
                  >
                    +{team.delta}
                  </motion.span>
                )}
              </div>

              <div
                className={`${config.height} ${config.barBg} relative w-full rounded-t-2xl flex flex-col items-center justify-start pt-4 md:pt-6 min-w-[100px] md:min-w-[160px]`}
                style={
                  config.place === 1
                    ? { boxShadow: '0 0 40px rgba(226, 179, 71, 0.4), 0 0 80px rgba(226, 179, 71, 0.2)' }
                    : undefined
                }
              >
                <span className="text-4xl md:text-6xl font-black text-white/90">
                  {config.label}
                </span>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

export function MobilePodium({ teams }: PodiumProps) {
  if (teams.length === 0) return null

  const top3 = teams.slice(0, 3)
  const colors = ['#e2b347', '#7396dc', '#d85c34']

  return (
    <div className="flex flex-col gap-3 md:hidden">
      <AnimatePresence mode="popLayout">
        {top3.map((team, i) => (
          <motion.div
            key={team.id}
            layoutId={`mobile-podium-${team.id}`}
            className="flex items-center gap-4 rounded-2xl bg-white/80 px-5 py-4 backdrop-blur-sm"
            style={{ borderLeft: `5px solid ${colors[i]}` }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl font-black text-white"
              style={{ backgroundColor: colors[i] }}
            >
              {i + 1}
            </span>
            <span className="flex-1 text-xl font-bold text-[#0b1525] truncate">{team.name}</span>
            <span className="text-2xl font-black" style={{ color: colors[i] }}>
              <AnimatedScore value={team.points} />
            </span>
            {team.delta != null && team.delta > 0 && (
              <motion.span
                className="text-sm font-bold text-green-600"
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 2, delay: 1 }}
              >
                +{team.delta}
              </motion.span>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
