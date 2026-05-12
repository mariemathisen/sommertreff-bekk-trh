'use client'

import { motion } from 'framer-motion'
import { AnimatedScore } from './AnimatedScore'

type LeaderboardRowProps = {
  rank: number
  name: string
  points: number
  id: string
  delta?: number
}

export function LeaderboardRow({ rank, name, points, id, delta }: LeaderboardRowProps) {
  return (
    <motion.div
      layout
      layoutId={`row-${id}`}
      className="flex items-center gap-4 rounded-xl bg-white/70 px-5 py-3 md:px-6 md:py-4 backdrop-blur-sm"
      transition={{ type: 'spring', stiffness: 120, damping: 22, mass: 0.8 }}
    >
      <span className="flex h-8 w-8 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-full bg-[#0b1525]/10 text-base md:text-lg font-bold text-[#0b1525]">
        {rank}
      </span>
      <span className="flex-1 text-lg md:text-xl font-semibold text-[#0b1525] truncate">{name}</span>
      <span className="text-xl md:text-2xl font-bold text-[#0b1525]">
        <AnimatedScore value={points} />
      </span>
      {delta != null && delta > 0 && (
        <motion.span
          className="text-sm font-bold text-green-600"
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 0, y: -8 }}
          transition={{ duration: 2, delay: 1 }}
        >
          +{delta}
        </motion.span>
      )}
    </motion.div>
  )
}
