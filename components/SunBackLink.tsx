import Link from 'next/link'
import Image from 'next/image'

const backLabel = 'TILBAKE TIL FORSIDEN'
const arcGlyphs = Array.from(backLabel)
const wordGapUnit = 0.75

function unitForGlyph(char: string) {
  if (char === ' ') return wordGapUnit
  if ('I'.includes(char)) return 0.56
  if ('LJT'.includes(char)) return 0.78
  if ('MW'.includes(char)) return 1.28
  return 1
}

const totalUnits = arcGlyphs.reduce((sum, char) => sum + unitForGlyph(char), 0)

// Pre-compute angles for each glyph
const glyphAngles = (() => {
  const angles: number[] = []
  let cursor = 0
  for (const char of arcGlyphs) {
    const currentUnit = unitForGlyph(char)
    const unitCenter = cursor + currentUnit / 2
    angles.push(74 - (unitCenter / Math.max(totalUnits, 1)) * 148)
    cursor += currentUnit
  }
  return angles
})()

export default function SunBackLink() {
  return (
    <Link
      href="/"
      className="group fixed left-4 top-4 z-50 inline-flex p-2 text-black"
      aria-label="Tilbake til forsiden"
    >
      <span className="relative h-[160px] w-[176px]">
        <Image
          src="/sun.png"
          alt=""
          width={92}
          height={92}
          aria-hidden
          className="absolute left-1/2 top-4 h-[92px] w-[92px] -translate-x-1/2 transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:rotate-[360deg]"
        />
        <span aria-hidden className="pointer-events-none absolute inset-0">
          {arcGlyphs.map((char, index) => {
            if (char === ' ') return null
            return (
              <span
                key={`${char}-${index}`}
                className="absolute left-1/2 top-[44%] text-[11px] font-semibold leading-none"
                style={{
                  transform: `translate(-50%, -50%) rotate(${glyphAngles[index]}deg) translateY(58px)`,
                }}
              >
                {char}
              </span>
            )
          })}
        </span>
      </span>
    </Link>
  )
}
