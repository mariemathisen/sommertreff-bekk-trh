const viewWidth = 1000
const viewHeight = 4000

const mainRopePath = `
  M 612 -84
  C 650 14, 736 126, 862 236
  C 930 296, 986 382, 960 500
  C 930 636, 798 744, 606 820
  C 414 896, 224 1004, 128 1154
  C 58 1264, 62 1412, 214 1452
  C 374 1496, 590 1388, 624 1246
  C 660 1096, 470 1112, 302 1236
  C 124 1368, 92 1608, 222 1768
  C 350 1926, 626 1962, 822 2090
  C 974 2188, 982 2410, 840 2574
  C 692 2746, 434 2792, 224 2878
  C 92 2932, 32 3030, 74 3132
  C 128 3264, 282 3310, 366 3254
  C 454 3194, 418 3062, 292 3064
  C 152 3068, 70 3196, 122 3340
  C 184 3516, 420 3556, 676 3498
  C 866 3456, 976 3508, 932 3630
  C 886 3754, 664 3808, 450 3822
  C 254 3834, 90 3882, 24 4012
`
  .replace(/\s+/g, ' ')
  .trim()

export default function ScrollBuntingGamesSection({
  className = '',
}: {
  className?: string
}) {
  return (
    <section className={`relative w-full overflow-x-clip ${className}`}>
      <div className="relative w-full" style={{ height: `${viewHeight}px` }}>
        <svg
          aria-hidden
          viewBox={`0 0 ${viewWidth} ${viewHeight}`}
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        >
          <path
            d={mainRopePath}
            fill="none"
            stroke="#111111"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            opacity="0.96"
          />
        </svg>
      </div>
    </section>
  )
}
