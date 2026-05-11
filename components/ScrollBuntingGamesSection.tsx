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
  ['18:30-18:45', 'Gr 1', 'Gr 2', 'Gr 3, 4, 5, 6'],
  ['18:50-19:05', 'Gr 3', 'Gr 4', 'Gr 1, 2, 5, 6'],
  ['19:10-19:25', 'Gr 5', 'Gr 6', 'Gr 1, 2, 3, 4'],
  ['19:30-19:45', 'Gr 2', 'Gr 1', 'Gr 3, 4, 5, 6'],
  ['19:50-20:05', 'Gr 4', 'Gr 3', 'Gr 1, 2, 5, 6'],
  ['20:10-20:25', 'Gr 6', 'Gr 5', 'Gr 1, 2, 3, 4'],
  ['20:30-20:45', 'Gr 1', 'Gr 2', 'Gr 3, 4, 5, 6'],
  ['20:50-21:05', 'Gr 3', 'Gr 4', 'Gr 1, 2, 5, 6'],
  ['21:10-21:25', 'Gr 5', 'Gr 6', 'Gr 1, 2, 3, 4'],
]
const timetableRows = timetableCells.length
const timetableColumns = timetableCells[0].length
const timetableX = 316
const timetableY = 1008
const timetableWidth = 580
const timetableHeaderHeight = 68
const timetableHeaderToBodyGap = 15
const timetableBodyRows = Math.max(timetableRows - 1, 1)
const timetableBodyRowGap = 10
const timetableBodyRowHeight = 47
const timetableHeight =
  timetableHeaderHeight +
  timetableHeaderToBodyGap +
  timetableBodyRows * timetableBodyRowHeight +
  (timetableBodyRows - 1) * timetableBodyRowGap
const timetableColumnFractions = [0.22, 0.27, 0.24, 0.27] as const
const timetableColumnWidths = timetableColumnFractions.map((fraction) => fraction * timetableWidth)
const timetableColumnOffsets = timetableColumnWidths.reduce<number[]>((offsets, width, index) => {
  if (index === 0) {
    offsets.push(0)
  } else {
    offsets.push(offsets[index - 1] + timetableColumnWidths[index - 1])
  }

  return offsets
}, [])
const timetableHeaderColors = ['#f08e7e', '#aebddd', '#e6bc66', '#b8c0ac'] as const
const timetableTimeColors = ['#f5d9cf', '#dde3ef', '#d9ddcf', '#f3e2c6', '#f4d8cf'] as const
const timetableLineColor = '#243d5d'
const timetableLineSoftColor = 'rgba(41, 70, 106, 0.12)'
const timetableDashColor = 'rgba(164, 173, 188, 0.64)'
const timetableTextColor = '#1f3552'
const timetableHeaderInsetX = 11
const timetableHeaderInsetY = 6
const timetableHeaderRadius = 24
const timetableTimeInsetX = 6
const timetableTimeRadius = 14
const timetableFontFamily =
  'Avenir Next Rounded, Avenir Next, Nunito Sans, Helvetica Neue, Arial, sans-serif'

const descriptionSections = [
  {
    title: 'Logikkolympics',
    body:
      'Hvordan tenker man logisk når tiden går og laget har tre ulike teorier samtidig? Hvor raskt klarer man å se mønstre, finne system og lande et svar før de andre lagene? I Logikkolympics venter tre oppgaver hvor samarbeid, resonnering og litt konkurranseinstinkt fort blir viktigere enn man skulle tro.',
    top: 1840,
    left: 7,
    width: 48,
  },
  {
    title: 'Sommelierlekene',
    body:
      'Hvor mye av vinsmaking handler egentlig om kunnskap, og hvor mye handler om å si ting med nok selvtillit? I Sommelierlekene blir det fort tydelig hvem som faktisk kan vin — og hvem som bare kan snakke om den.',
    top: 2680,
    left: 46,
    width: 47,
  },
  {
    title: 'Kongen befaler',
    body:
      'Hvor kreativ blir man egentlig når oppgavene gir null mening ved første gjennomlesning? Og hvor langt er man villig til å strekke komfortsonen for noen ekstra poeng?',
    top: 3480,
    left: 7,
    width: 48,
  },
  {
    title: 'MVP før midnatt',
    body:
      'Kan man selge hva som helst med riktig nettside og nok selvtillit? Hvor langt kommer man med sterke vibber, tvilsomme buzzwords og et godt design? I Vibbekode får lagene tildelt et produkt og skal lage den mest kreative nettsiden de klarer — før alt pitchepresenteres for resten på slutten av kvelden.',
    top: 4280,
    left: 46,
    width: 47,
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

function createCurvedHorizontalPath(startX: number, endX: number, y: number, curve: number) {
  const width = endX - startX

  return [
    `M ${startX} ${y}`,
    `C ${startX + width * 0.28} ${y - curve}, ${startX + width * 0.72} ${y + curve}, ${endX} ${y}`,
  ].join(' ')
}

function createCurvedVerticalPath(x: number, startY: number, endY: number, curve: number) {
  const height = endY - startY

  return [
    `M ${x} ${startY}`,
    `C ${x + curve} ${startY + height * 0.24}, ${x - curve} ${startY + height * 0.76}, ${x} ${endY}`,
  ].join(' ')
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
            <filter id="timetable-soften" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="0.65" />
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
            <path
              d={createCurvedHorizontalPath(
                timetableX + 1,
                timetableX + timetableWidth - 1,
                timetableY + timetableHeaderHeight,
                2.6,
              )}
              fill="none"
              stroke={timetableLineSoftColor}
              strokeWidth="3"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              filter="url(#timetable-soften)"
            />
            <path
              d={createCurvedHorizontalPath(
                timetableX + 1,
                timetableX + timetableWidth - 1,
                timetableY + timetableHeaderHeight,
                2.6,
              )}
              fill="none"
              stroke={timetableLineColor}
              strokeWidth="1.15"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />

            {timetableCells[0].map((cell, columnIndex) => {
              const cellX = timetableX + timetableColumnOffsets[columnIndex]
              const cellWidth = timetableColumnWidths[columnIndex]
              const headerWidth = Math.max(56, cellWidth - timetableHeaderInsetX * 2)
              const headerHeight = timetableHeaderHeight - timetableHeaderInsetY * 2
              const headerCenterX = cellX + timetableHeaderInsetX + headerWidth / 2
              const headerCenterY = timetableY + timetableHeaderInsetY + headerHeight / 2

              return (
                <g key={`timetable-header-${columnIndex}`}>
                  <rect
                    x={cellX + timetableHeaderInsetX}
                    y={timetableY + timetableHeaderInsetY}
                    width={headerWidth}
                    height={headerHeight}
                    rx={timetableHeaderRadius}
                    fill={timetableHeaderColors[columnIndex]}
                    fillOpacity="0.96"
                  />
                  <text
                    x={headerCenterX}
                    y={headerCenterY}
                    fill={timetableTextColor}
                    fontFamily={timetableFontFamily}
                    fontSize={columnIndex === 0 ? 10.4 : 10.8}
                    fontWeight="590"
                    letterSpacing="0.03em"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    opacity="0.98"
                  >
                    {cell.toUpperCase()}
                  </text>
                </g>
              )
            })}

            {Array.from({ length: timetableColumns - 1 }).map((_, separatorIndex) => {
              const separatorX =
                timetableX + timetableColumnOffsets[separatorIndex] + timetableColumnWidths[separatorIndex]
              const verticalPath = createCurvedVerticalPath(
                separatorX,
                timetableY + timetableHeaderHeight,
                timetableY + timetableHeight,
                2.8 + separatorIndex * 0.3,
              )

              return (
                <g key={`timetable-column-separator-${separatorIndex}`}>
                  <path
                    d={verticalPath}
                    fill="none"
                    stroke={timetableLineSoftColor}
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                    filter="url(#timetable-soften)"
                  />
                  <path
                    d={verticalPath}
                    fill="none"
                    stroke={timetableLineColor}
                    strokeWidth="1.08"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              )
            })}

            {Array.from({ length: Math.max(0, timetableBodyRows - 1) }).map((_, rowIndex) => {
              const separatorY =
                timetableY +
                timetableHeaderHeight +
                timetableHeaderToBodyGap +
                (rowIndex + 1) * timetableBodyRowHeight +
                rowIndex * timetableBodyRowGap +
                timetableBodyRowGap / 2
              const rowStartX = timetableX + timetableColumnWidths[0] + 8
              const rowEndX = timetableX + timetableWidth - 10

              return (
                <path
                  key={`timetable-row-separator-${rowIndex}`}
                  d={createCurvedHorizontalPath(rowStartX, rowEndX, separatorY, rowIndex % 2 === 0 ? 1.4 : -1.4)}
                  fill="none"
                  stroke={timetableDashColor}
                  strokeWidth="0.82"
                  strokeDasharray="2.2 5.4"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                  opacity="0.82"
                />
              )
            })}

            {timetableCells.slice(1).map((row, rowIndex) => {
              const rowY =
                timetableY +
                timetableHeaderHeight +
                timetableHeaderToBodyGap +
                rowIndex * (timetableBodyRowHeight + timetableBodyRowGap)

              return row.map((cell, columnIndex) => {
                const cellX = timetableX + timetableColumnOffsets[columnIndex]
                const cellWidth = timetableColumnWidths[columnIndex]
                const isTimeColumn = columnIndex === 0
                const cellInsetX = isTimeColumn ? timetableTimeInsetX : 7
                const contentWidth = Math.max(54, cellWidth - cellInsetX * 2)
                const textCenterX = cellX + cellInsetX + contentWidth / 2
                const textCenterY = rowY + timetableBodyRowHeight / 2

                return (
                  <g key={`timetable-cell-${rowIndex}-${columnIndex}`}>
                    {isTimeColumn ? (
                      <rect
                        x={cellX + timetableTimeInsetX}
                        y={rowY + 1.5}
                        width={Math.max(56, cellWidth - timetableTimeInsetX * 2)}
                        height={timetableBodyRowHeight - 3}
                        rx={timetableTimeRadius}
                        fill={timetableTimeColors[rowIndex % timetableTimeColors.length]}
                        fillOpacity="0.94"
                      />
                    ) : null}
                    <text
                      x={textCenterX}
                      y={textCenterY}
                      fill={timetableTextColor}
                      fontFamily={timetableFontFamily}
                      fontSize={isTimeColumn ? 11.6 : columnIndex === 3 ? 10.8 : 11.2}
                      fontWeight={isTimeColumn ? '580' : '530'}
                      letterSpacing={isTimeColumn ? '0.01em' : '0.004em'}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      opacity={isTimeColumn ? '0.98' : '0.94'}
                    >
                      {cell}
                    </text>
                  </g>
                )
              })
            })}
          </g>
        </svg>

        {descriptionSections.map((section) => (
          <article
            key={section.title}
            className="absolute z-10 w-[min(54rem,50vw)] max-w-[92vw] rounded-[1.75rem] bg-[#d6e8f5]/90 p-4 text-left text-[#0b1525] backdrop-blur-[2px] md:bg-transparent md:p-0 md:backdrop-blur-none"
            style={{ top: `${section.top}px`, left: `${section.left}%`, width: `${section.width}%` }}
          >
            <h2
              className="text-2xl font-black leading-none tracking-tight sm:text-3xl md:text-[2.7rem]"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              {section.title}
            </h2>
            <p
              className="mt-9 text-base leading-[1.48] sm:text-lg md:text-[1.45rem]"
              style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
            >
              {section.body}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}
