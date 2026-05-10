import Link from 'next/link'
import Image from 'next/image'
import ScrollBuntingGamesSection from '@/components/ScrollBuntingGamesSection'

export default function DagensAktiviteterPage() {
  const backLabel = 'TILBAKE TIL FORSIDEN'
  const arcGlyphs = Array.from(backLabel)
  const wordGapUnit = 0.75
  const unitForGlyph = (char: string) => {
    if (char === ' ') return wordGapUnit
    if ('I'.includes(char)) return 0.56
    if ('LJT'.includes(char)) return 0.78
    if ('MW'.includes(char)) return 1.28
    return 1
  }
  const totalUnits = arcGlyphs.reduce((sum, char) => sum + unitForGlyph(char), 0)
  let unitCursor = 0

  return (
    <main className="relative min-h-screen overflow-x-clip bg-[#d6e8f5] px-6 py-20 pb-[3800px] text-[#0b1525] sm:py-28">
      <ScrollBuntingGamesSection className="absolute inset-x-0 top-0 z-0" />

      <Link
        href="/"
        className="group absolute left-4 top-4 z-20 inline-flex p-2 text-black"
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
              const currentUnit = unitForGlyph(char)
              const unitCenter = unitCursor + currentUnit / 2
              const angle = 74 - (unitCenter / Math.max(totalUnits, 1)) * 148
              unitCursor += currentUnit

              if (char === ' ') {
                return null
              }

              return (
                <span
                  key={`${char}-${index}`}
                  className="absolute left-1/2 top-[44%] text-[11px] font-semibold leading-none"
                  style={{
                    transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(58px)`,
                  }}
                >
                  {char}
                </span>
              )
            })}
          </span>
        </span>
      </Link>

      <div className="absolute inset-x-0 top-[46vh] z-10 mx-auto w-full max-w-5xl -translate-y-1/2 text-center">
        <h1
          className="text-5xl font-black leading-none tracking-tight text-transparent sm:text-7xl md:text-8xl"
          style={{ WebkitTextStroke: '2px #d8452e' }}
        >
          Dagens utfordringer
        </h1>
        <p className="mx-auto mt-10 max-w-3xl text-xl leading-relaxed text-[#d8452e] sm:text-2xl">
          Nysgjerrig på hva vi skal gjennom i dag? Ta en sniktitt her da vel
        </p>
      </div>
    </main>
  )
}
