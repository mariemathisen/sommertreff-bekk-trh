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

type PennantPlacement = {
  x: number
  y: number
  angle: number
  width: number
  height: number
  tipX: number
  topJitter: number
  windRotation: number
  angleOffset: number
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

function normalizeAngle(angle: number) {
  let normalized = angle

  while (normalized <= -180) normalized += 360
  while (normalized > 180) normalized -= 360

  return normalized
}

function pennantColorAt(index: number) {
  return pennantPalette[index % pennantPalette.length]
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
      const width = 54 + noise(index, 1) * 6
      const height = width * (1.42 + noise(index, 2) * 0.12)
      const tipX = centeredNoise(index, 3) * width * 0.04
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
      const farAngle = (Math.atan2(farNext.y - farPrev.y, farNext.x - farPrev.x) * 180) / Math.PI
      const curvature = Math.abs(normalizeAngle(farAngle - angle))
      const shouldRenderPennant =
        !(isFirstLoopRegion && colorIndex === 0) &&
        !(isCrossingGreenRegion && colorIndex === 1) &&
        !(isLoopOverlapGreenRegion && colorIndex === 1)

      if (shouldRenderPennant) {
        nextPennants.push({
          x: point.x,
          y: point.y,
          angle,
          width,
          height,
          tipX,
          topJitter: centeredNoise(index, 6) * 1.1,
          windRotation:
            centeredNoise(index, 7) * 2.2 +
            (noise(index, 8) > 0.88 ? centeredNoise(index, 9) * 2.4 : 0),
          angleOffset: 0,
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

          {pennants.map((pennant, index) => {
            const leftBase = -pennant.width * 0.5
            const rightBase = pennant.width * 0.5
            const pennantPath = `
              M ${leftBase} 0
              Q ${leftBase + pennant.width * 0.3} ${-0.65 + pennant.topJitter * 0.14} ${rightBase} 0
              L ${pennant.tipX} ${pennant.height}
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
                  transform={`translate(${pennant.topJitter} 0) rotate(${pennant.windRotation + pennant.angleOffset})`}
                >
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
                    d={`M ${leftBase * 0.78} 1 Q ${pennant.tipX * 0.12} ${pennant.height * 0.22} ${pennant.tipX * 0.02} ${pennant.height * 0.86}`}
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
        </svg>
      </div>
    </section>
  )
}
