import ScrollBuntingGamesSection, { scrollBuntingViewHeight } from '@/components/ScrollBuntingGamesSection'
import SunBackLink from '@/components/SunBackLink'

export default function DagensAktiviteterPage() {
  return (
    <main
      className="relative overflow-x-clip bg-[#d6e8f5] px-6 py-20 text-[#0b1525] sm:py-28"
      style={{ minHeight: `${scrollBuntingViewHeight}px` }}
    >
      <ScrollBuntingGamesSection className="absolute inset-x-0 top-0 z-0" />

      <SunBackLink />

      <div className="absolute left-1/2 top-[62vh] z-10 w-full max-w-5xl -translate-x-[58%] -translate-y-1/2 text-left">
        <h1
          className="text-5xl font-black leading-[0.95] text-[#0b1525] sm:text-7xl md:text-8xl"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          Dagens utfordringer
        </h1>
        <p className="mt-10 max-w-3xl text-xl leading-relaxed text-[#0b1525] sm:text-2xl">
          Nysgjerrig på hva vi skal gjennom i dag? Følg snoren da vel!
        </p>
      </div>
    </main>
  )
}
