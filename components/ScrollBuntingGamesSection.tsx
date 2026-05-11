'use client'

import { useEffect, useRef, useState } from 'react'

const viewWidth = 1000
const viewHeight = 4000

const mainRopePath = `
  M 612 -84
  C 650 14, 736 126, 862 236
  C 930 296, 986 382, 960 500
  C 930 636, 798 744, 606 820
  C 414 896, 224 1004, 128 1154
  C 106 1216, 168 1266, 264 1280
  C 332 1290, 392 1272, 418 1246
  C 440 1222, 412 1216, 368 1238
  C 302 1270, 214 1404, 222 1768
  C 350 1926, 626 1962, 822 2090
  C 974 2188, 982 2410, 840 2574
  C 692 2746, 434 2792, 224 2878
  C 110 2934, 60 3018, 92 3110
  C 132 3216, 244 3278, 320 3252
  C 394 3226, 400 3150, 350 3096
  C 286 3028, 206 3116, 154 3342
  C 118 3526, 420 3556, 676 3498
  C 866 3456, 976 3508, 932 3630
  C 886 3754, 664 3808, 450 3822
  C 254 3834, 90 3882, 24 4012
`
  .replace(/\s+/g, ' ')
  .trim()

const pennantPalette = ['#7396dc', '#88aa88', '#ef9795', '#d85c34', '#e2b347']
const pennantWidth = 58
const pennantHeight = 84

type PennantPlacement = {
  x: number
  y: number
  angle: number
  windRotation: number
  attachOffset: number
  swayRotation: number
  swayDuration: number
  swayDelay: number
  floatX: number
  floatY: number
  floatDuration: number
  floatDelay: number
  centerX: number
  centerY: number
  color: string
  opacity: number
  textureId: string
}

function fract(value: number) {
  return value - Math.floor(value)
}

function noise(index: number, seed: number) {
  return fract(Math.sin(index * 12.9898 + seed * 78.233) * 43758.5453123)
}

function centeredNoise(index: number, seed: number) {
  return noise(index, seed) * 2 - 1
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function normalizeAngle(angle: number) {
  let normalized = angle

  while (normalized <= -180) normalized += 360
  while (normalized > 180) normalized -= 360

  return normalized
}

function pennantColorAt(index: number) {
  return pennantPalette[index % pennantPalette.length]
}

function hasPennantOverlap(candidate: { centerX: number; centerY: number }, pennants: PennantPlacement[]) {
  return pennants.some((pennant) => {
    const dx = candidate.centerX - pennant.centerX
    const dy = candidate.centerY - pennant.centerY

    return (dx / 62) ** 2 + (dy / 78) ** 2 < 1
  })
}

export default function ScrollBuntingGamesSection({
  className = '',
}: {
  className?: string
}) {
  const pathRef = useRef<SVGPathElement>(null)
  const [pennants, setPennants] = useState<PennantPlacement[]>([])

  useEffect(() => {
    const path = pathRef.current

    if (!path) {
      return
    }

    const totalLength = path.getTotalLength()
    const nextPennants: PennantPlacement[] = []
    let distance = 150
    let index = 0

    while (distance < totalLength - 82) {
      const colorIndex = index % pennantPalette.length
      const basePoint = path.getPointAtLength(distance)
      const isFirstLoopRegion =
        basePoint.y >= 1120 && basePoint.y <= 1660 && basePoint.x <= 500
      const isCrossingGreenRegion =
        basePoint.y >= 1860 && basePoint.y <= 2360 && basePoint.x >= 360 && basePoint.x <= 560
      const isLoopOverlapGreenRegion =
        basePoint.y >= 1180 && basePoint.y <= 1480 && basePoint.x >= 240 && basePoint.x <= 430
      const adjustedDistance =
        colorIndex === 1 && isLoopOverlapGreenRegion
          ? Math.min(totalLength - 60, distance + 132)
          : distance
      const point = path.getPointAtLength(adjustedDistance)
      const nearPrev = path.getPointAtLength(Math.max(0, adjustedDistance - 7))
      const nearNext = path.getPointAtLength(Math.min(totalLength, adjustedDistance + 7))
      const farPrev = path.getPointAtLength(Math.max(0, adjustedDistance - 30))
      const farNext = path.getPointAtLength(Math.min(totalLength, adjustedDistance + 30))
      const dx = nearNext.x - nearPrev.x
      const dy = nearNext.y - nearPrev.y
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI
      const naturalHang = clamp(
        Math.sin(index * 0.58 + 1.1) * 9 +
          Math.sin(index * 0.23 + 2.4) * 5 +
          centeredNoise(index, 7) * 2.2,
        -17,
        17,
      )
      const windRotation = -angle + naturalHang
      const hangRadians = (naturalHang * Math.PI) / 180
      const centerX = point.x - Math.sin(hangRadians) * pennantHeight * 0.42
      const centerY = point.y + Math.cos(hangRadians) * pennantHeight * 0.42
      const farAngle = (Math.atan2(farNext.y - farPrev.y, farNext.x - farPrev.x) * 180) / Math.PI
      const curvature = Math.abs(normalizeAngle(farAngle - angle))
      const shouldRenderPennant =
        !(isFirstLoopRegion && colorIndex === 0) &&
        !(isCrossingGreenRegion && colorIndex === 1) &&
        !(isLoopOverlapGreenRegion && colorIndex === 1)

      if (shouldRenderPennant && !hasPennantOverlap({ centerX, centerY }, nextPennants)) {
        nextPennants.push({
          x: point.x,
          y: point.y,
          angle,
          windRotation,
          attachOffset: centeredNoise(index, 6) * 1.8,
          swayRotation: 1.8 + noise(index, 16) * 1.7,
          swayDuration: 4.8 + noise(index, 17) * 2.8,
          swayDelay: -noise(index, 18) * 6.5,
          floatX: centeredNoise(index, 19) * 0.7,
          floatY: centeredNoise(index, 20) * 0.9,
          floatDuration: 5.8 + noise(index, 21) * 3.2,
          floatDelay: -noise(index, 22) * 7.5,
          centerX,
          centerY,
          color: pennantColorAt(colorIndex),
          opacity: 0.92 + noise(index, 11) * 0.04,
          textureId: `pennant-texture-${index}`,
        })
      }

      const spacing =
        92 +
        noise(index, 12) * 16 +
        Math.min(curvature / 44, 1) * 18 +
        (noise(index, 13) > 0.84 ? 14 : 0) +
        (isFirstLoopRegion ? 28 : 0)

      distance += spacing
      index += 1
    }

    setPennants(nextPennants)
  }, [])

  return (
    <section className={`relative w-full overflow-x-clip ${className}`}>
      <div className="relative w-full" style={{ height: `${viewHeight}px` }}>
        <svg
          aria-hidden
          viewBox={`0 0 ${viewWidth} ${viewHeight}`}
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        >
          <defs>
            <filter id="rope-soften" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="0.7" />
            </filter>
          </defs>

          <path
            d={mainRopePath}
            fill="none"
            stroke="#8b9bb3"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            opacity="0.18"
            filter="url(#rope-soften)"
          />
          <path
            ref={pathRef}
            d={mainRopePath}
            fill="none"
            stroke="#7687a2"
            strokeWidth="2.05"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            opacity="0.94"
          />

          {pennants.map((pennant, index) => {
            const leftBase = -pennantWidth * 0.5
            const rightBase = pennantWidth * 0.5
            const pennantPath = `
              M ${leftBase} 0
              Q ${leftBase + pennantWidth * 0.3} -0.65 ${rightBase} 0
              L 0 ${pennantHeight}
              Z
            `
              .replace(/\s+/g, ' ')
              .trim()

            return (
              <g
                key={`${pennant.x}-${pennant.y}-${index}`}
                transform={`translate(${pennant.x} ${pennant.y}) rotate(${pennant.angle})`}
              >
                <defs>
                  <pattern
                    id={pennant.textureId}
                    width="26"
                    height="26"
                    patternUnits="userSpaceOnUse"
                    patternTransform={`rotate(${20 + (index % 2) * 4})`}
                  >
                    <rect width="26" height="26" fill="rgba(255,255,255,0.018)" />
                    <path
                      d="M -4 7 L 10 -3 M 2 16 L 20 3 M 11 28 L 28 12"
                      stroke="rgba(255,255,255,0.14)"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M -3 13 L 5 19 M 12 8 L 20 14"
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="0.9"
                      strokeLinecap="round"
                    />
                  </pattern>
                </defs>
                <g
                  transform={`translate(${pennant.attachOffset} 0) rotate(${pennant.windRotation})`}
                >
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    values={`${-pennant.swayRotation} 0 0; ${pennant.swayRotation} 0 0; ${-pennant.swayRotation} 0 0`}
                    dur={`${pennant.swayDuration}s`}
                    begin={`${pennant.swayDelay}s`}
                    repeatCount="indefinite"
                    additive="sum"
                    calcMode="spline"
                    keyTimes="0;0.5;1"
                    keySplines="0.42 0 0.58 1;0.42 0 0.58 1"
                  />
                  <animateTransform
                    attributeName="transform"
                    type="translate"
                    values={`0 0; ${pennant.floatX} ${pennant.floatY}; 0 0`}
                    dur={`${pennant.floatDuration}s`}
                    begin={`${pennant.floatDelay}s`}
                    repeatCount="indefinite"
                    additive="sum"
                    calcMode="spline"
                    keyTimes="0;0.5;1"
                    keySplines="0.45 0 0.55 1;0.45 0 0.55 1"
                  />
                  <path
                    d={pennantPath}
                    fill={pennant.color}
                    fillOpacity={pennant.opacity}
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth="0.45"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                  <path
                    d={pennantPath}
                    fill={`url(#${pennant.textureId})`}
                    fillOpacity="0.42"
                    vectorEffect="non-scaling-stroke"
                  />
                  <path
                    d={`M ${leftBase * 0.78} 1 Q 0 ${pennantHeight * 0.28} 0 ${pennantHeight * 0.86}`}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth="0.7"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              </g>
            )
          })}
        </svg>
      </div>
    </section>
  )
}
