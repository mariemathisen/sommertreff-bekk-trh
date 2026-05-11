'use client'

import { useEffect, useRef, useState } from 'react'

const viewWidth = 1000
const viewHeight = 4800

const mainRopePath = `
  M 188 -58
  C 322 24, 514 90, 706 144
  C 858 186, 968 238, 992 314
  C 1020 410, 972 530, 860 624
  C 730 734, 514 814, 278 870
  C 278 870, 128 926, 104 1072
  C 80 1434, 138 1654, 302 1714
  C 466 1774, 742 1834, 900 1772
  C 982 1988, 988 2138, 900 2184
  C 798 2238, 720 2128, 774 2058
  C 840 1970, 884 2258, 730 2358
  C 584 2460, 188 2360, 178 2478
  C 168 2596, 88 2780, 246 2868
  C 334 2960, 706 3004, 866 2956
  C 978 2924, 932 3258, 788 3440
  C 660 3586, 700 3746, 850 3842
  C 938 3898, 860 3980, 604 4026
`
  .replace(/\s+/g, ' ')
  .trim()

const pennantPalette = ['#7396dc', '#88aa88', '#ef9795', '#d85c34', '#e2b347']
const pennantWidth = 58
const pennantHeight = 84

const timetableCells = [
  ['Tid', 'Videoloftet', 'Sofaloftet', 'Selvgående'],
  ['18:30-18:45', 'Gr 1', 'Gr 2', 'Gr 3,4,5,6'],
  ['18:50-19:05', 'Gr 3', 'Gr 4', 'Gr 1,2,5,6'],
  ['19:10-19:25', 'Gr 5', 'Gr 6  ', 'Gr 1,2,3,4'],
  ['19:30-19:45', 'Gr 2', 'Gr 1', 'Gr 3,4,5,6'],
  ['19:50-20:05', 'Gr 4', 'Gr 3', 'Gr 1,2,5,6'],
  ['20:10-20:25', 'Gr 6', 'Gr 5', 'Gr 1,2,3,4'],
  ['20:30-20:45', 'Gr 1', 'Gr 2', 'Gr 3,4,5,6'],
  ['20:50-21:05', 'Gr 3', 'Gr 4', 'Gr 1,2,5,6'],
  ['21:10-21:25', 'Gr 5', 'Gr 6', 'Gr 1,2,3,4'],
]
const timetableRows = timetableCells.length
const timetableColumns = timetableCells[0].length
const timetableX = 548
const timetableY = 1100
const timetableWidth = 372
const timetableHeight = 620
const timetableColumnWidth = timetableWidth / timetableColumns
const timetableRowHeight = timetableHeight / timetableRows

const descriptionSections = [
  {
    title: 'Videoloftet',
    body:
      'Her kan dere legge inn en kort forklaring om hva som skjer i denne posten, hvordan gruppene roterer, og hva deltakerne bør være forberedt på.',
    cta: 'Se aktiviteten',
    top: 1840,
    left: 7,
    width: 38,
  },
  {
    title: 'Sofaloftet',
    body:
      'Denne flaten er satt av til en ny forklaringstekst i samme stil, med nok luft rundt seg til at tauet fortsatt ser naturlig ut.',
    cta: 'Les mer',
    top: 2680,
    left: 55,
    width: 37,
  },
  {
    title: 'Selvgående utfordringer',
    body:
      'Bruk dette området til å beskrive oppgaver som kan gjøres i eget tempo, med korte instruksjoner og eventuelle tips til gjennomføring.',
    cta: 'Se opplegget',
    top: 3480,
    left: 7,
    width: 38,
  },
  {
    title: 'Finalerunden',
    body:
      'Nederst er det gjort plass til en fjerde forklaring, slik at hele siden kan følge samme rytme videre nedover uten at tekst og vimpler krasjer.',
    cta: 'Åpne detaljene',
    top: 4280,
    left: 55,
    width: 37,
  },
] as const

const pennantClearanceZones = [
  {
    xMin: timetableX - 28,
    xMax: timetableX + timetableWidth + 28,
    yMin: timetableY - 56,
    yMax: timetableY + timetableHeight + 52,
  },
  ...descriptionSections.map((section) => ({
    xMin: (viewWidth * section.left) / 100 - 24,
    xMax: (viewWidth * (section.left + section.width)) / 100 + 24,
    yMin: section.top - 44,
    yMax: section.top + 418,
  })),
] as const

type PennantPlacement = {
  x: number
  y: number
  angle: number
  windRotation: number
  attachOffset: number
  hangOffset: number
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

type Point = {
  x: number
  y: number
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

    return (dx / 64) ** 2 + (dy / 82) ** 2 < 1
  })
}

function hasPennantCrowding(
  candidate: { x: number; y: number; centerX: number; centerY: number },
  pennants: PennantPlacement[],
) {
  return pennants.some((pennant) => {
    const ropeDx = candidate.x - pennant.x
    const ropeDy = candidate.y - pennant.y
    const centerDx = candidate.centerX - pennant.centerX
    const centerDy = candidate.centerY - pennant.centerY

    return (ropeDx / 88) ** 2 + (ropeDy / 122) ** 2 < 1 || (centerDx / 72) ** 2 + (centerDy / 94) ** 2 < 1
  })
}

function hasNearbyRopeSegment(
  path: SVGPathElement,
  totalLength: number,
  candidateDistance: number,
  candidate: { x: number; y: number; centerX: number; centerY: number },
) {
  for (let sampleDistance = 0; sampleDistance <= totalLength; sampleDistance += 42) {
    if (Math.abs(sampleDistance - candidateDistance) < 190) {
      continue
    }

    const sample = path.getPointAtLength(sampleDistance)
    const dx = sample.x - candidate.centerX
    const dy = sample.y - candidate.centerY
    const anchorDx = sample.x - candidate.x
    const anchorDy = sample.y - candidate.y

    if ((dx / 96) ** 2 + (dy / 118) ** 2 < 1 || (anchorDx / 54) ** 2 + (anchorDy / 72) ** 2 < 1) {
      return true
    }
  }

  return false
}

function isInsideClearanceZone(point: Point) {
  return pennantClearanceZones.some(
    (zone) =>
      point.x >= zone.xMin &&
      point.x <= zone.xMax &&
      point.y >= zone.yMin &&
      point.y <= zone.yMax,
  )
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
      const point = path.getPointAtLength(distance)
      const nearPrev = path.getPointAtLength(Math.max(0, distance - 7))
      const nearNext = path.getPointAtLength(Math.min(totalLength, distance + 7))
      const farPrev = path.getPointAtLength(Math.max(0, distance - 30))
      const farNext = path.getPointAtLength(Math.min(totalLength, distance + 30))
      const dx = nearNext.x - nearPrev.x
      const dy = nearNext.y - nearPrev.y
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI
      const ropeInfluence = clamp(angle * 0.14, -12, 12)
      const naturalHang = clamp(
        Math.sin(index * 0.58 + 1.1) * 9 +
          Math.sin(index * 0.23 + 2.4) * 5 +
          centeredNoise(index, 7) * 2.2,
        -17,
        17,
      )
      const windRotation = -angle + ropeInfluence + naturalHang
      const hangRadians = (naturalHang * Math.PI) / 180
      const centerX = point.x - Math.sin(hangRadians) * pennantHeight * 0.42
      const centerY = point.y + Math.cos(hangRadians) * pennantHeight * 0.42
      const farAngle = (Math.atan2(farNext.y - farPrev.y, farNext.x - farPrev.x) * 180) / Math.PI
      const curvature = Math.abs(normalizeAngle(farAngle - angle))
      const isTightCurve = curvature > 26
      const hasCrowding = hasPennantCrowding({ x: point.x, y: point.y, centerX, centerY }, nextPennants)
      const hasRopeConflict = hasNearbyRopeSegment(path, totalLength, distance, {
        x: point.x,
        y: point.y,
        centerX,
        centerY,
      })
      const shouldRenderPennant =
        !isInsideClearanceZone(point) &&
        !isInsideClearanceZone({ x: centerX, y: centerY }) &&
        !hasRopeConflict

      if (
        shouldRenderPennant &&
        !hasPennantOverlap({ centerX, centerY }, nextPennants) &&
        !hasCrowding
      ) {
        nextPennants.push({
          x: point.x,
          y: point.y,
          angle,
          windRotation,
          attachOffset: centeredNoise(index, 6) * 0.9,
          hangOffset: 4.8 + noise(index, 14) * 2.2,
          swayRotation: 5.2 + noise(index, 16) * 4.1,
          swayDuration: 3.1 + noise(index, 17) * 1.8,
          swayDelay: -noise(index, 18) * 6.5,
          floatX: centeredNoise(index, 19) * 2.8,
          floatY: centeredNoise(index, 20) * 3.6,
          floatDuration: 3.7 + noise(index, 21) * 2.1,
          floatDelay: -noise(index, 22) * 7.5,
          centerX,
          centerY,
          color: pennantColorAt(colorIndex),
          opacity: 0.92 + noise(index, 11) * 0.04,
          textureId: `pennant-texture-${index}`,
        })
      }

      const spacing =
        70 +
        noise(index, 12) * 6 +
        Math.min(curvature / 28, 1) * 14 +
        (isTightCurve ? 8 : 0)

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
                <path
                  d={`M 0 0 Q ${pennant.attachOffset * 0.45} ${pennant.hangOffset * 0.3} ${pennant.attachOffset} ${pennant.hangOffset + 3}`}
                  fill="none"
                  stroke="rgba(118, 135, 162, 0.72)"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
                <g
                  transform={`translate(${pennant.attachOffset} ${pennant.hangOffset}) rotate(${pennant.windRotation})`}
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

          <g aria-hidden opacity="0.92">
            {Array.from({ length: timetableRows + 1 }, (_, index) => {
              const y = timetableY + timetableRowHeight * index

              return (
                <path
                  key={`timetable-row-${index}`}
                  d={`M ${timetableX} ${y} L ${timetableX + timetableWidth} ${y}`}
                  fill="none"
                  stroke="#0b1525"
                  strokeWidth="1.05"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              )
            })}
            {Array.from({ length: timetableColumns + 1 }, (_, index) => {
              const x = timetableX + timetableColumnWidth * index

              return (
                <path
                  key={`timetable-column-${index}`}
                  d={`M ${x} ${timetableY} L ${x} ${timetableY + timetableHeight}`}
                  fill="none"
                  stroke="#0b1525"
                  strokeWidth="1.05"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              )
            })}
            {timetableCells.map((row, rowIndex) =>
              row.map((cell, columnIndex) => {
                const isHeader = rowIndex === 0

                return (
                  <foreignObject
                    key={`timetable-cell-${rowIndex}-${columnIndex}`}
                    x={timetableX + timetableColumnWidth * columnIndex + 7}
                    y={timetableY + timetableRowHeight * rowIndex + 7}
                    width={timetableColumnWidth - 14}
                    height={timetableRowHeight - 14}
                  >
                    <div
                      className={`flex h-full w-full items-center justify-center text-center leading-[1.05] text-[#0b1525] ${
                        isHeader ? 'font-black' : 'font-bold'
                      }`}
                      style={{
                        fontFamily: 'Arial, Helvetica, sans-serif',
                        fontSize: isHeader && cell.length > 12 ? '14px' : '16px',
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {cell}
                    </div>
                  </foreignObject>
                )
              }),
            )}
          </g>
        </svg>

        {descriptionSections.map((section) => (
          <article
            key={section.title}
            className="absolute z-10 w-[min(38rem,38vw)] max-w-[84vw] rounded-[1.75rem] bg-[#d6e8f5]/90 p-4 text-left text-[#2741ca] backdrop-blur-[2px] md:bg-transparent md:p-0 md:backdrop-blur-none"
            style={{ top: `${section.top}px`, left: `${section.left}%`, width: `${section.width}%` }}
          >
            <h2 className="text-4xl font-black leading-[0.95] tracking-tight sm:text-5xl md:text-[4rem]">
              {section.title}
            </h2>
            <p className="mt-8 text-xl leading-[1.38] sm:text-2xl md:text-[2.05rem]">
              {section.body}
            </p>
            <span className="mt-10 inline-flex items-center justify-center border-[3px] border-[#ef4b23] px-7 py-4 text-lg font-medium text-[#ef4b23] sm:text-xl">
              {section.cta}
            </span>
          </article>
        ))}
      </div>
    </section>
  )
}
