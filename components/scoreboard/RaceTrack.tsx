'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AnimatedScore } from './AnimatedScore'

type RaceTeam = {
  id: string
  name: string
  points: number
  delta?: number
}

type RaceTrackProps = {
  teams: RaceTeam[]
}

const RANK_STYLES = [
  {
    gradient: 'linear-gradient(90deg, #f6d365 0%, #fda085 50%, #e2b347 100%)',
    glow: '0 0 20px rgba(226,179,71,0.5), 0 0 40px rgba(226,179,71,0.25)',
    badge: 'bg-gradient-to-br from-yellow-400 to-amber-500',
    runner: '🏆',
    textColor: '#b8860b',
  },
  {
    gradient: 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #7396dc 100%)',
    glow: '0 0 15px rgba(115,150,220,0.4)',
    badge: 'bg-gradient-to-br from-blue-400 to-indigo-500',
    runner: '🏃',
    textColor: '#4a5ea8',
  },
  {
    gradient: 'linear-gradient(90deg, #f093fb 0%, #f5576c 50%, #d85c34 100%)',
    glow: '0 0 15px rgba(216,92,52,0.35)',
    badge: 'bg-gradient-to-br from-pink-400 to-red-500',
    runner: '🏃',
    textColor: '#c0392b',
  },
  {
    gradient: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
    glow: 'none',
    badge: 'bg-gradient-to-br from-cyan-400 to-blue-500',
    runner: '🏃',
    textColor: '#2980b9',
  },
  {
    gradient: 'linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)',
    glow: 'none',
    badge: 'bg-gradient-to-br from-emerald-400 to-teal-500',
    runner: '🏃',
    textColor: '#16a085',
  },
  {
    gradient: 'linear-gradient(90deg, #fa709a 0%, #fee140 100%)',
    glow: 'none',
    badge: 'bg-gradient-to-br from-rose-400 to-yellow-400',
    runner: '🏃',
    textColor: '#e74c8b',
  },
  {
    gradient: 'linear-gradient(90deg, #a18cd1 0%, #fbc2eb 100%)',
    glow: 'none',
    badge: 'bg-gradient-to-br from-purple-400 to-pink-300',
    runner: '🏃',
    textColor: '#8e44ad',
  },
  {
    gradient: 'linear-gradient(90deg, #ffecd2 0%, #fcb69f 100%)',
    glow: 'none',
    badge: 'bg-gradient-to-br from-orange-300 to-red-400',
    runner: '🏃',
    textColor: '#e67e22',
  },
]

function getStyle(rank: number) {
  return RANK_STYLES[Math.min(rank, RANK_STYLES.length - 1)]
}

export function RaceTrack({ teams }: RaceTrackProps) {
  if (teams.length === 0) return null

  const MAX_POSSIBLE = 50
  const ceiling = Math.max(MAX_POSSIBLE, ...teams.map((t) => t.points))

  return (
    <div className="flex flex-col gap-3 md:gap-4">
      <AnimatePresence mode="popLayout">
        {teams.map((team, i) => {
          const style = getStyle(i)
          const pct = Math.max((team.points / ceiling) * 100, 8)
          const isLeader = i === 0 && team.points > 0
          const leaderJustScored = isLeader && team.delta != null && team.delta > 0

          return (
            <motion.div
              key={team.id}
              layout
              layoutId={`race-${team.id}`}
              className={`relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm ${leaderJustScored ? 'leader-flash' : ''}`}
              initial={{ opacity: 0, x: -40, scale: 0.95 }}
              animate={leaderJustScored
                ? { opacity: 1, x: [0, -6, 6, -4, 4, -2, 2, 0], scale: 1 }
                : { opacity: 1, x: 0, scale: 1 }
              }
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={leaderJustScored
                ? { x: { duration: 0.6, ease: 'easeInOut' }, type: 'spring', stiffness: 100, damping: 18, mass: 0.8 }
                : { type: 'spring', stiffness: 100, damping: 18, mass: 0.8 }
              }
              style={isLeader ? { boxShadow: style.glow } : undefined}
            >
              {/* Top section: rank badge, name, score */}
              <div className="relative z-10 flex items-center gap-3 px-4 pt-3 pb-1 md:px-5 md:pt-4 md:pb-2">
                <span
                  className={`${style.badge} flex h-9 w-9 md:h-11 md:w-11 shrink-0 items-center justify-center rounded-full text-base md:text-lg font-black text-white shadow-lg`}
                >
                  {i + 1}
                </span>
                <span className="flex-1 text-lg md:text-2xl font-bold text-[#0b1525] truncate">
                  {team.name}
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className="text-2xl md:text-3xl font-black tabular-nums"
                    style={{ color: style.textColor }}
                  >
                    <AnimatedScore value={team.points} />
                  </span>
                  <span className="text-xs md:text-sm font-semibold text-[#5f7387] uppercase tracking-wider">
                    poeng
                  </span>
                  {team.delta != null && team.delta > 0 && (
                    <motion.span
                      className="text-sm md:text-base font-black text-green-500"
                      initial={{ opacity: 1, scale: 1.3, y: 0 }}
                      animate={{ opacity: 0, scale: 1, y: -12 }}
                      transition={{ duration: 2.5, delay: 0.5 }}
                    >
                      +{team.delta}
                    </motion.span>
                  )}
                </div>
              </div>

              {/* Progress bar with runner */}
              <div className="relative px-4 pb-3 md:px-5 md:pb-4">
                <div className="relative h-8 md:h-10 w-full rounded-full bg-[#0b1525]/5 overflow-hidden">
                  {/* Animated fill bar */}
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ background: style.gradient }}
                    initial={{ width: '0%' }}
                    animate={{ width: `${pct}%` }}
                    transition={{
                      type: 'spring',
                      stiffness: 50,
                      damping: 15,
                      mass: 1,
                    }}
                  >
                    {/* Shimmer overlay on bar */}
                    {isLeader && (
                      <div className="absolute inset-0 rounded-full race-bar-shimmer" />
                    )}
                  </motion.div>

                  {/* Runner figure */}
                  <motion.div
                    className="absolute top-1/2 -translate-y-1/2 z-20"
                    initial={{ left: '0%' }}
                    animate={{ left: `${pct}%` }}
                    transition={{
                      type: 'spring',
                      stiffness: 50,
                      damping: 15,
                      mass: 1,
                    }}
                    style={{ marginLeft: '-14px' }}
                  >
                    <motion.span
                      className="text-2xl md:text-3xl block"
                      animate={
                        isLeader
                          ? { y: [0, -4, 0], rotate: [0, -5, 0, 5, 0] }
                          : { y: [0, -2, 0] }
                      }
                      transition={{
                        duration: isLeader ? 1.2 : 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    >
                      {style.runner}
                    </motion.span>
                  </motion.div>
                </div>
              </div>

              {/* Leader crown flash */}
              {isLeader && (
                <motion.div
                  className="absolute -top-1 -right-1 text-3xl md:text-4xl"
                  animate={{
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  👑
                </motion.div>
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
