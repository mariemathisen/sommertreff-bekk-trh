'use client'

import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

type AnimatedScoreProps = {
  value: number
  className?: string
}

export function AnimatedScore({ value, className = '' }: AnimatedScoreProps) {
  const motionValue = useMotionValue(value)
  const spring = useSpring(motionValue, { stiffness: 80, damping: 20, mass: 0.8 })
  const display = useTransform(spring, (v) => Math.round(v))
  const prevValue = useRef(value)
  const hasChanged = useRef(false)

  useEffect(() => {
    if (prevValue.current !== value) {
      hasChanged.current = true
      prevValue.current = value
    }
    motionValue.set(value)
  }, [value, motionValue])

  return (
    <motion.span
      className={`inline-block tabular-nums ${className}`}
      animate={
        hasChanged.current
          ? {
              scale: [1, 1.2, 1],
              color: ['inherit', '#e2b347', 'inherit'],
            }
          : undefined
      }
      transition={{ duration: 0.5 }}
      onAnimationComplete={() => {
        hasChanged.current = false
      }}
    >
      <DisplayValue display={display} />
    </motion.span>
  )
}

function DisplayValue({ display }: { display: ReturnType<typeof useTransform<number, number>> }) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const unsubscribe = display.on('change', (v) => {
      if (ref.current) {
        ref.current.textContent = String(v)
      }
    })
    return unsubscribe
  }, [display])

  return <span ref={ref}>{display.get()}</span>
}
