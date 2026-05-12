'use client'

import { motion } from 'framer-motion'
import { useEffect, useId, useRef, useState } from 'react'

export const scrollBuntingViewHeight = 4800

const viewWidth = 1000
const viewHeight = scrollBuntingViewHeight
const initiallyVisiblePennants = 5

const mainRopePath = `
  M 188 -58
  C 322 24, 514 90, 706 144
  C 858 186, 968 238, 992 314
  C 1020 410, 972 530, 860 624
  C 730 734, 514 814, 278 870
  C 278 870, 128 926, 104 1072
  C 80 1434, 138 1654, 302 1714
  C 550 1790, 830 1920, 810 2080
  C 790 2240, 750 2320, 730 2358
  C 584 2460, 188 2360, 178 2478
  C 168 2596, 88 2780, 246 2868
  C 334 2960, 706 3004, 866 2956
  C 978 2924, 932 3258, 788 3440
  C 660 3586, 700 3746, 850 3842
  C 938 3898, 860 3980, 604 4026
  C 570 4044, 536 4060, 522 4082
  C 506 4108, 512 4130, 530 4138
  C 546 4144, 558 4136, 560 4122
`
  .replace(/\s+/g, ' ')
  .trim()

const ropeKnotPaths = [
  'M 560 4122 C 552 4116, 548 4132, 560 4144 C 574 4158, 592 4148, 588 4132 C 584 4116, 566 4112, 560 4122',
  'M 562 4124 C 574 4112, 594 4120, 596 4138 C 598 4154, 582 4162, 568 4154 C 554 4146, 552 4128, 562 4124',
  'M 556 4134 C 566 4124, 584 4124, 592 4134 C 600 4144, 590 4156, 574 4156 C 560 4156, 550 4144, 556 4134',
  'M 592 4148 C 606 4150, 622 4160, 630 4174',
] as const

const pennantPalette = ['#7396dc', '#88aa88', '#ef9795', '#d85c34', '#e2b347']
const pennantWidth = 58
const pennantHeight = 84
const pennantPath = `
  M ${-pennantWidth * 0.5} 0
  Q ${-pennantWidth * 0.2} -0.65 ${pennantWidth * 0.5} 0
  L 0 ${pennantHeight}
  Z
`
  .replace(/\s+/g, ' ')
  .trim()

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
const timetableX = 316
const timetableY = 1008
const timetableWidth = 580
const timetableHeaderHeight = 68
const timetableHeaderToBodyGap = 15
const timetableBodyRows = Math.max(timetableRows - 1, 1)
const timetableBodyRowGap = 10
const timetableBodyRowHeight = 47
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
const timetableLineColor = '#243d5d'
const timetableLineSoftColor = 'rgba(41, 70, 106, 0.12)'
const timetableDashColor = 'rgba(164, 173, 188, 0.64)'
const timetableTextColor = '#1f3552'
const timetableHeaderInsetX = 11
const timetableHeaderInsetY = 6
const timetableTimeInsetX = 6
const timetableFontFamily = 'var(--font-geist-sans), sans-serif'

const descriptionSections = [
  {
    title: 'Logikkolympics',
    body:
      'Hvordan tenker man logisk når tiden går og laget har tre ulike teorier samtidig? Hvor raskt klarer man å se mønstre, finne system og lande et svar før de andre lagene? I Logikkolympics venter tre oppgaver hvor samarbeid, resonnering og litt konkurranseinstinkt fort blir viktigere enn man skulle tro.',
    top: 1980,
    left: 17,
    width: 48,
  },
  {
    title: 'Sommelierlekene',
    body:
      'Hvor mye av vinsmaking handler egentlig om kunnskap, og hvor mye handler om å si ting med nok selvtillit? I Sommelierlekene blir det fort tydelig hvem som faktisk kan vin og hvem som bare kan snakke om den.',
    top: 2600,
    left: 37,
    width: 47,
  },
  {
    title: 'Kongen befaler',
    body:
      'Hvor kreativ blir man egentlig når oppgavene gir null mening ved første gjennomlesning? Og hvor langt er man villig til å strekke komfortsonen for noen ekstra poeng?',
    top: 3110,
    left: 11,
    width: 48,
  },
  {
    title: 'MVP før midnatt',
    body:
      'Kan man selge hva som helst med riktig nettside og nok selvtillit? Hvor langt kommer man med sterke vibber, tvilsomme buzzwords og et godt design? I Vibbekode får lagene tildelt et produkt og skal lage den mest kreative nettsiden de klarer før alt pitchepresenteres for resten på slutten av kvelden.',
    top: 3550,
    left: 15,
    width: 47,
  },
] as const

type PennantPlacement = {
  x: number
  y: number
  angle: number
  color: string
  opacity: number
  textureId: string
  distanceRatio: number
  revealIndex: number
}

function fract(value: number) {
  return value - Math.floor(value)
}

function noise(index: number, seed: number) {
  return fract(Math.sin(index * 12.9898 + seed * 78.233) * 43758.5453123)
}

function pennantColorAt(index: number) {
  return pennantPalette[index % pennantPalette.length]
}

function createCurvedHorizontalPath(startX: number, endX: number, y: number, curve: number) {
  const width = endX - startX

  return [
    `M ${startX} ${y}`,
    `C ${startX + width * 0.28} ${y - curve}, ${startX + width * 0.72} ${y + curve}, ${endX} ${y}`,
  ].join(' ')
}

function RopePennant({ pennant, textureId }: { pennant: PennantPlacement; textureId: string }) {
  return (
    <g
      data-ratio={pennant.distanceRatio}
      data-opacity={pennant.opacity}
      transform={`translate(${pennant.x} ${pennant.y}) rotate(${pennant.angle})`}
      opacity={pennant.revealIndex < initiallyVisiblePennants ? pennant.opacity : 0}
    >
      <line
        x1="0"
        y1="-1.5"
        x2="0"
        y2="3"
        stroke="rgba(118, 135, 162, 0.72)"
        strokeWidth="1.2"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={pennantPath}
        fill={pennant.color}
        fillOpacity={1}
        stroke="rgba(255, 255, 255, 0.16)"
        strokeWidth="0.7"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={pennantPath}
        fill={`url(#${textureId})`}
        fillOpacity="0.48"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={`M ${-pennantWidth * 0.39} 1 Q 0 ${pennantHeight * 0.28} 0 ${pennantHeight * 0.86}`}
        fill="none"
        stroke="rgba(255, 255, 255, 0.14)"
        strokeWidth="0.9"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </g>
  )
}

export default function ScrollBuntingGamesSection({
  className = '',
}: {
  className?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const shadowPathRef = useRef<SVGPathElement>(null)
  const pennantGroupRef = useRef<SVGGElement>(null)
  const [pennants, setPennants] = useState<PennantPlacement[]>([])
  const idPrefix = useId().replace(/:/g, '')

  useEffect(() => {
    const path = pathRef.current
    const shadowPath = shadowPathRef.current
    const container = containerRef.current
    if (!path || !container) return

    // --- Compute pennant positions once ---
    const totalLength = path.getTotalLength()
    const nextPennants: PennantPlacement[] = []
    let distance = 150
    let index = 0
    let revealIndex = 0

    while (distance < totalLength - 82) {
      const point = path.getPointAtLength(distance)
      const nearPrev = path.getPointAtLength(Math.max(0, distance - 7))
      const nearNext = path.getPointAtLength(Math.min(totalLength, distance + 7))
      const dx = nearNext.x - nearPrev.x
      const dy = nearNext.y - nearPrev.y
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI
      const inCurl = point.x > 500 && point.x < 650 && point.y > 4050 && point.y < 4180

      if (!inCurl) {
        nextPennants.push({
          x: point.x,
          y: point.y,
          angle,
          color: pennantColorAt(index),
          opacity: 0.96 + noise(index, 11) * 0.04,
          textureId: `${idPrefix}-pennant-texture-${index}`,
          distanceRatio: distance / totalLength,
          revealIndex,
        })
        revealIndex += 1
      }

      distance += 130
      index += 1
    }

    const anchorPennant = nextPennants[initiallyVisiblePennants - 1]
    const initRatio = anchorPennant ? Math.min(1, anchorPennant.distanceRatio + 0.06) : 0.08
    setPennants(nextPennants)

    // --- Set up scroll-driven rope drawing ---
    // vectorEffect="non-scaling-stroke" causes the browser to interpret
    // strokeDasharray/strokeDashoffset in *screen* coordinates, not SVG
    // user coordinates.  Because preserveAspectRatio="none" scales X and Y
    // differently, the screen-space arc length differs from the user-space
    // value returned by getTotalLength().  We therefore compute the
    // screen-space length once (and again on resize) and use it for all
    // dash calculations.

    const remapSamples = 500

    // Sample positions in user space — reused for both Y-envelope and
    // screen-space length computation.
    const samplePoints: { x: number; y: number }[] = new Array(remapSamples + 1)
    const yEnvelope: number[] = new Array(remapSamples + 1)
    let runMax = -Infinity
    let yMaxPath = -Infinity
    for (let i = 0; i <= remapSamples; i++) {
      const pt = path.getPointAtLength((i / remapSamples) * totalLength)
      samplePoints[i] = { x: pt.x, y: pt.y }
      if (pt.y > yMaxPath) yMaxPath = pt.y
      runMax = Math.max(runMax, pt.y)
      yEnvelope[i] = runMax
    }
    const initEnvelopeY = yEnvelope[Math.round(initRatio * remapSamples)]

    // Look up the path-length ratio where the running-max Y first reaches targetY.
    function ratioForY(targetY: number): number {
      for (let i = 0; i <= remapSamples; i++) {
        if (yEnvelope[i] >= targetY) return i / remapSamples
      }
      return 1
    }

    // Screen-space cumulative arc lengths at each sample.
    let screenLengths = new Float64Array(remapSamples + 1)
    let screenTotalLength = 0

    function rebuildScreenLengths() {
      const ctm = path!.getCTM()
      const sx = ctm ? ctm.a : 1
      const sy = ctm ? ctm.d : 1
      let cum = 0
      screenLengths[0] = 0
      for (let i = 1; i <= remapSamples; i++) {
        const dx = (samplePoints[i].x - samplePoints[i - 1].x) * sx
        const dy = (samplePoints[i].y - samplePoints[i - 1].y) * sy
        cum += Math.sqrt(dx * dx + dy * dy)
        screenLengths[i] = cum
      }
      screenTotalLength = cum

      const screenDash = String(screenTotalLength)
      path!.style.strokeDasharray = screenDash
      if (shadowPath) {
        shadowPath.style.strokeDasharray = screenDash
      }
    }

    // Cache container offset — recalculate only on resize.
    let containerTop = 0
    const measureContainer = () => {
      containerTop = container.getBoundingClientRect().top + window.scrollY
      rebuildScreenLengths()
    }
    measureContainer()

    const updateDash = () => {
      // The viewport's "lead edge" — the Y coordinate in the container where
      // the rope tip should be.  65 % of the viewport height gives a nice
      // look-ahead so the rope arrives before the user scrolls to it.
      const viewportLead = 0.65 * window.innerHeight
      const scrolled = window.scrollY - containerTop + viewportLead

      // Because preserveAspectRatio="none" and viewBox height === container
      // height, SVG Y coordinates map 1 : 1 to container pixel Y.  Use
      // scrolled directly as the target Y for the envelope lookup.
      const targetY = Math.min(yMaxPath, Math.max(initEnvelopeY, scrolled))
      const ratio = Math.max(initRatio, ratioForY(targetY))

      // Convert the user-space ratio to a screen-space dash offset.
      const sampleIdx = Math.min(remapSamples, Math.round(ratio * remapSamples))
      const screenArc = screenLengths[sampleIdx]
      const offset = String(screenTotalLength - screenArc)
      path.style.strokeDashoffset = offset
      if (shadowPath) shadowPath.style.strokeDashoffset = offset

      // Reveal pennants well behind the rope tip so rope visually arrives first.
      const pennantRatio = Math.max(0, ratio - 0.08)
      const group = pennantGroupRef.current
      if (group) {
        const children = group.children
        for (let i = 0; i < children.length; i++) {
          const el = children[i] as SVGGElement
          const r = Number(el.getAttribute('data-ratio'))
          const targetOpacity = el.getAttribute('data-opacity') || '1'
          el.setAttribute('opacity', r <= pennantRatio ? targetOpacity : '0')
        }
      }
    }
    updateDash()

    window.addEventListener('scroll', updateDash, { passive: true })
    window.addEventListener('resize', measureContainer, { passive: true })
    return () => {
      window.removeEventListener('scroll', updateDash)
      window.removeEventListener('resize', measureContainer)
    }
  }, [idPrefix])

  return (
    <section className={`relative w-full overflow-x-clip ${className}`}>
      <div ref={containerRef} className="relative w-full" style={{ height: `${viewHeight}px` }}>
        <motion.svg
          aria-hidden
          viewBox={`0 0 ${viewWidth} ${viewHeight}`}
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        >
          <defs>
            <filter id={`${idPrefix}-timetable-soften`} x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="0.65" />
            </filter>
            {[0, 1].map((variant) => (
              <pattern
                key={`pennant-tex-${variant}`}
                id={`${idPrefix}-pennant-texture-${variant}`}
                width="26"
                height="26"
                patternUnits="userSpaceOnUse"
                patternTransform={`rotate(${20 + variant * 4})`}
              >
                <rect width="26" height="26" fill="rgba(255,255,255,0.028)" />
                <path
                  d="M -4 7 L 10 -3 M 2 16 L 20 3 M 11 28 L 28 12"
                  stroke="rgba(255,255,255,0.18)"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
                <path
                  d="M -3 13 L 5 19 M 12 8 L 20 14"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="0.9"
                  strokeLinecap="round"
                />
              </pattern>
            ))}
          </defs>

          <path
            ref={shadowPathRef}
            d={mainRopePath}
            fill="none"
            stroke="#a3b1c6"
            strokeWidth="3.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            opacity="0.18"
          />
          <path
            ref={pathRef}
            d={mainRopePath}
            fill="none"
            stroke="#617ca6"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            opacity="1"
          />

          <g aria-hidden>
            {ropeKnotPaths.map((knotPath) => (
              <path
                key={`${knotPath}-shadow`}
                d={knotPath}
                fill="none"
                stroke="#a3b1c6"
                strokeWidth="3.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                opacity="0.12"
              />
            ))}
            {ropeKnotPaths.map((knotPath) => (
              <path
                key={knotPath}
                d={knotPath}
                fill="none"
                stroke="#7687a2"
                strokeWidth="2.05"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                opacity="0.94"
              />
            ))}
          </g>

          <g ref={pennantGroupRef}>
            {pennants.map((pennant, index) => (
              <RopePennant
                key={`${pennant.x}-${pennant.y}-${index}`}
                pennant={pennant}
                textureId={`${idPrefix}-pennant-texture-${pennant.revealIndex % 2}`}
              />
            ))}
          </g>

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
              filter={`url(#${idPrefix}-timetable-soften)`}
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
              const headerRectX = cellX + timetableHeaderInsetX
              const headerRectY = timetableY + timetableHeaderInsetY
              const headerCenterX = headerRectX + headerWidth / 2
              const headerCenterY = headerRectY + headerHeight / 2

              return (
                <text
                  key={`timetable-header-${columnIndex}`}
                  x={headerCenterX}
                  y={headerCenterY}
                  fill={timetableTextColor}
                  fontFamily='Georgia, "Times New Roman", serif'
                  fontSize="15"
                  fontWeight="900"
                  letterSpacing="0.01em"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {cell}
                </text>
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
                  d={createCurvedHorizontalPath(
                    rowStartX,
                    rowEndX,
                    separatorY,
                    rowIndex % 2 === 0 ? 1.4 : -1.4,
                  )}
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
                    {!isTimeColumn && (
                      <rect
                        x={cellX + 5}
                        y={rowY + 3}
                        width={cellWidth - 10}
                        height={timetableBodyRowHeight - 6}
                        rx="7"
                        fill="rgba(255, 255, 255, 0.48)"
                        stroke="rgba(36, 61, 93, 0.12)"
                        strokeWidth="0.8"
                      />
                    )}
                    <text
                      x={textCenterX}
                      y={textCenterY}
                      fill={timetableTextColor}
                      fontFamily={timetableFontFamily}
                      fontSize={isTimeColumn ? 11.6 : columnIndex === 3 ? 10.2 : 11.2}
                      fontWeight={isTimeColumn ? '580' : '620'}
                      letterSpacing={isTimeColumn ? '0.01em' : '0.004em'}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      opacity={isTimeColumn ? '0.98' : '0.96'}
                    >
                      {cell}
                    </text>
                  </g>
                )
              })
            })}
          </g>
        </motion.svg>

        {descriptionSections.map((section, index) => (
          <motion.article
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3, margin: '0px 0px -12% 0px' }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: index * 0.05 }}
            className="absolute z-10 max-w-[92vw] rounded-[1.75rem] bg-[#d6e8f5]/90 p-4 text-left text-[#0b1525] shadow-[0_14px_38px_rgba(90,118,150,0.08)] backdrop-blur-[2px] md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-none"
            style={{ top: `${section.top}px`, left: `${section.left}%`, width: `${section.width}%` }}
          >
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-[#50667f] sm:text-xs">
              Gren {String(index + 1).padStart(2, '0')}
            </p>
            <h2
              className="mt-3 text-2xl font-black leading-none tracking-tight sm:text-3xl md:text-[2.7rem]"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              {section.title}
            </h2>
            <p
              className="mt-7 text-base leading-[1.55] sm:text-lg md:text-[1.45rem]"
              style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
            >
              {section.body}
            </p>
          </motion.article>
        ))}
      </div>
    </section>
  )
}
