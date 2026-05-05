const logos = [
  { name: 'Aura Bank', abbr: 'AB' },
  { name: 'Global Connect', abbr: 'GC' },
  { name: 'Nexus Corp', abbr: 'NX' },
  { name: 'Vantage BPO', abbr: 'VB' },
  { name: 'Meridian Group', abbr: 'MG' },
]

export default function SocialProofSection() {
  return (
    <section className="bg-slate-50 py-14 px-6 border-y border-slate-100">
      <div className="max-w-5xl mx-auto">
        <p className="text-center text-slate-400 text-sm font-medium uppercase tracking-widest mb-10">
          Empresas que optimizan su operación con nosotros
        </p>
        <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16">
          {logos.map(({ name, abbr }) => (
            <div
              key={name}
              className="flex items-center gap-2 opacity-40 grayscale hover:opacity-70 hover:grayscale-0 transition-all"
            >
              {/* Simulated logo mark */}
              <div className="w-8 h-8 rounded-md bg-slate-700 flex items-center justify-center text-white text-xs font-black">
                {abbr}
              </div>
              <span className="text-slate-700 font-bold text-sm tracking-tight">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
