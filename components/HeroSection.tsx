'use client'

import Image from 'next/image'
import Link from 'next/link'
import { MotionConfig, motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'

type BirdConfig = {
  id: string
  src: string
  baseX: string
  baseY: string
  width: number
  opacity: number
  blurClass?: string
  z: number
  duration: number
  delay: number
  driftX: [number, number, number, number, number]
  bobY: [number, number, number, number, number]
  rotate: [number, number, number, number, number]
}

type PatchImageProps = {
  name: string
  hovered: boolean
}

const BIRDS: BirdConfig[] = [
  {
    id: 'bird-0',
    src: '/Object.png',
    baseX: '10%',
    baseY: '12%',
    width: 88,
    opacity: 0.8,
    z: 30,
    duration: 14.4,
    delay: 0,
    driftX: [0, 18, 36, 12, 0],
    bobY: [0, -12, -20, -8, 0],
    rotate: [0, -2, 1, -1, 0],
  },
  {
    id: 'bird-1',
    src: '/Object-5.png',
    baseX: '76%',
    baseY: '14%',
    width: 94,
    opacity: 0.8,
    z: 36,
    duration: 15.3,
    delay: 1.2,
    driftX: [0, -22, -40, -16, 0],
    bobY: [0, -14, -24, -9, 0],
    rotate: [0, 2, -1, 1, 0],
  },
  {
    id: 'bird-2',
    src: '/Object-2.png',
    baseX: '66%',
    baseY: '30%',
    width: 72,
    opacity: 0.58,
    blurClass: 'blur-[1px]',
    z: 24,
    duration: 18,
    delay: 2.4,
    driftX: [0, 20, 34, 16, 0],
    bobY: [0, -8, -16, -6, 0],
    rotate: [0, -3, -1, -2, 0],
  },
  {
    id: 'bird-3',
    src: '/Object-3.png',
    baseX: '24%',
    baseY: '28%',
    width: 68,
    opacity: 0.55,
    blurClass: 'blur-[0.8px]',
    z: 22,
    duration: 14.4,
    delay: 0.8,
    driftX: [0, 14, 24, 9, 0],
    bobY: [0, -8, -14, -5, 0],
    rotate: [0, 1, 2, 1, 0],
  },
  {
    id: 'bird-4',
    src: '/Object-4.png',
    baseX: '82%',
    baseY: '36%',
    width: 74,
    opacity: 0.64,
    z: 32,
    duration: 13.5,
    delay: 1.8,
    driftX: [0, -18, -30, -12, 0],
    bobY: [0, -10, -18, -7, 0],
    rotate: [0, 2, 1, 2, 0],
  },
  {
    id: 'bird-5',
    src: '/Object-5.png',
    baseX: '35%',
    baseY: '18%',
    width: 84,
    opacity: 0.7,
    z: 35,
    duration: 11.7,
    delay: 0.4,
    driftX: [0, 18, 34, 14, 0],
    bobY: [0, -12, -22, -9, 0],
    rotate: [0, -1, -3, -1, 0],
  },
  {
    id: 'bird-6',
    src: '/Object-6.png',
    baseX: '60%',
    baseY: '30%',
    width: 62,
    opacity: 0.52,
    blurClass: 'blur-[1.2px]',
    z: 20,
    duration: 18.9,
    delay: 2.6,
    driftX: [0, -14, -26, -10, 0],
    bobY: [0, -6, -12, -5, 0],
    rotate: [0, 1, -1, 1, 0],
  },
  {
    id: 'bird-7',
    src: '/Object-7.png',
    baseX: '14%',
    baseY: '40%',
    width: 66,
    opacity: 0.48,
    blurClass: 'blur-[1.4px]',
    z: 18,
    duration: 19.8,
    delay: 3.2,
    driftX: [0, 10, 20, 9, 0],
    bobY: [0, -5, -10, -4, 0],
    rotate: [0, -1, 1, -1, 0],
  },
  {
    id: 'bird-8',
    src: '/Object-8.png',
    baseX: '60%',
    baseY: '45%',
    width: 98,
    opacity: 0.78,
    z: 38,
    duration: 12.6,
    delay: 1.4,
    driftX: [0, 24, 40, 18, 0],
    bobY: [0, -14, -26, -10, 0],
    rotate: [0, -2, -4, -2, 0],
  },
  {
    id: 'bird-9',
    src: '/Object-9.png',
    baseX: '72%',
    baseY: '48%',
    width: 58,
    opacity: 0.46,
    blurClass: 'blur-[1.6px]',
    z: 16,
    duration: 21.6,
    delay: 3.8,
    driftX: [0, -10, -20, -8, 0],
    bobY: [0, -5, -9, -4, 0],
    rotate: [0, 1, 2, 1, 0],
  },
  {
    id: 'bird-10',
    src: '/Object-10.png',
    baseX: '30%',
    baseY: '52%',
    width: 54,
    opacity: 0.42,
    blurClass: 'blur-[1.8px]',
    z: 14,
    duration: 22.5,
    delay: 4,
    driftX: [0, 8, 16, 6, 0],
    bobY: [0, -3, -6, -3, 0],
    rotate: [0, -1, 1, -1, 0],
  },
]

function PatchImage({ name, hovered }: PatchImageProps) {
  return (
    <div className="relative overflow-hidden" style={{ width: 'clamp(100px, 13vw, 220px)', height: 'clamp(100px, 13vw, 220px)' }}>
      {/* Browser-native img swap is more reliable here than layered optimized images. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={hovered ? `/${name}-hovered.png` : `/${name}.png`}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="block h-full w-full object-contain"
      />
    </div>
  )
}

export function HeroSection() {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const [hoveredPatch, setHoveredPatch] = useState<string | null>(null)
  const smoothX = useSpring(mouseX, { stiffness: 45, damping: 18, mass: 0.6 })
  const smoothY = useSpring(mouseY, { stiffness: 45, damping: 18, mass: 0.6 })

  const overlayTransform = useMotionTemplate`translate3d(${smoothX}px, ${smoothY}px, 0)`

  const birds = useMemo(() => BIRDS, [])

  useEffect(() => {
    for (const src of ['/poengoversikt-hovered.png', '/dagensleker-hovered.png']) {
      const preloadedImage = new window.Image()
      preloadedImage.src = src
    }
  }, [])

  return (
    <MotionConfig reducedMotion="never">
      <section
        className="relative isolate min-h-screen overflow-hidden bg-[#d6e8f5]"
        onMouseMove={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect()
          const viewportHeight = window.innerHeight || bounds.height
          const relativeX = (event.clientX - bounds.left) / bounds.width - 0.5
          const relativeY = event.clientY / viewportHeight - 0.5
          mouseX.set(relativeX * 8)
          mouseY.set(relativeY * 8)
        }}
        onMouseLeave={() => {
          mouseX.set(0)
          mouseY.set(0)
        }}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-screen overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(80%_58%_at_50%_12%,rgba(255,255,255,0.6),rgba(255,255,255,0))]" />

          <div className="relative mx-auto flex w-full max-w-7xl flex-col items-center px-4 pt-16 text-center sm:px-8 sm:pt-20">
            <div className="w-fit text-left">
              <p className="text-3xl font-medium leading-none text-[#0f172a] sm:text-4xl">Bekk</p>
              <h1 className="mt-4 text-5xl font-black leading-[0.95] tracking-tight text-[#0b1525] sm:text-7xl">
                Trondheims
                <br />
                Sommer<span className="font-serif italic font-normal text-[#d8452e]">leker</span>
              </h1>
            </div>
          </div>

          <div className="absolute inset-x-0 top-[36%] h-[52%] sm:top-[32%] sm:h-[56%]">
            <motion.div className="relative h-full w-full" style={{ transform: overlayTransform, willChange: 'transform' }}>
              {birds.map((bird) => (
                <motion.div
                  key={bird.id}
                  className="pointer-events-none absolute"
                  style={{ left: bird.baseX, top: bird.baseY, zIndex: bird.z, willChange: 'transform' }}
                  animate={{ x: bird.driftX, y: bird.bobY, rotate: bird.rotate }}
                  transition={{
                    duration: bird.duration,
                    delay: bird.delay,
                    ease: 'easeInOut',
                    repeat: Number.POSITIVE_INFINITY,
                    repeatType: 'loop',
                  }}
                >
                  <div
                    className="relative"
                    style={{
                      width: `clamp(${Math.round(bird.width * 0.7)}px, ${bird.width / 12}vw, ${bird.width}px)`,
                      aspectRatio: '1 / 0.72',
                      opacity: bird.opacity,
                    }}
                  >
                    <Image
                      src={bird.src}
                      alt=""
                      aria-hidden
                      fill
                      sizes={`${bird.width}px`}
                      className={`object-contain select-none ${bird.blurClass ?? ''}`}
                    />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        <div className="absolute inset-x-0 top-0 z-40 h-screen overflow-hidden">
          <Link
            href="/poengoversikt"
            aria-label="Gå til poengoversikt"
            className="pointer-events-auto absolute"
            style={{ right: 'clamp(24px, 8vw, 120px)', top: 'clamp(28px, 7vh, 72px)' }}
            onPointerEnter={() => setHoveredPatch('poengoversikt')}
            onPointerLeave={() => setHoveredPatch((current) => (current === 'poengoversikt' ? null : current))}
          >
            <PatchImage name="poengoversikt" hovered={hoveredPatch === 'poengoversikt'} />
          </Link>
          <button
            type="button"
            aria-label="Dagens utfordringer"
            className="pointer-events-auto absolute cursor-pointer"
            style={{ left: 'clamp(24px, 15vw, 260px)', top: 'clamp(560px, 58vh, 700px)' }}
            onPointerEnter={() => setHoveredPatch('dagensleker')}
            onPointerLeave={() => setHoveredPatch((current) => (current === 'dagensleker' ? null : current))}
          >
            <PatchImage name="dagensleker" hovered={hoveredPatch === 'dagensleker'} />
          </button>
        </div>
        <div className="relative z-10 px-4 pt-64 sm:pt-72">
          <div
            className="relative mx-auto"
            style={{
              width: 'clamp(160px,22vw,380px)',
              aspectRatio: '1191 / 5322',
            }}
          >
            <Image
              src="/statue.png"
              alt="Statue"
              fill
              priority
              sizes="(max-width: 640px) 220px, 30vw"
              className="object-contain"
            />
          </div>
        </div>
      </section>
    </MotionConfig>
  )
}
