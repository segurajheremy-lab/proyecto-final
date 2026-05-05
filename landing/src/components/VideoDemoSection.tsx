import { Play, Smile, Database } from 'lucide-react'

export default function VideoDemoSection() {
  return (
    <section className="bg-slate-50 py-20 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-3">
            Mira cómo funciona en acción
          </h2>
          <p className="text-slate-500 max-w-lg mx-auto">
            Un recorrido de 3 minutos por las funcionalidades principales de la plataforma.
          </p>
        </div>

        {/* Browser mockup */}
        <div className="relative">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* Browser chrome */}
            <div className="bg-slate-100 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-400" />
              <span className="w-3 h-3 rounded-full bg-yellow-400" />
              <span className="w-3 h-3 rounded-full bg-green-400" />
              <div className="ml-4 flex-1 bg-white rounded-md px-3 py-1 text-xs text-slate-400 border border-slate-200">
                callcenter-ia.app/demo
              </div>
            </div>

            {/* Video area */}
            <div className="relative bg-slate-900 aspect-video flex items-center justify-center">
              {/* Fake video thumbnail gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950" />

              {/* Grid lines for depth */}
              <div className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
                  backgroundSize: '40px 40px',
                }}
              />

              {/* Play button */}
              <button className="relative z-10 w-20 h-20 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center shadow-2xl shadow-blue-600/50 transition-all hover:scale-105">
                <Play size={32} className="text-white ml-1" fill="white" />
              </button>

              {/* Floating badge — top right */}
              <div className="absolute top-5 right-5 z-10 bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2.5 shadow-lg flex items-center gap-2">
                <Smile size={16} className="text-green-500" />
                <div>
                  <p className="text-xs font-bold text-slate-800">Sentimiento Positivo</p>
                  <p className="text-xs text-slate-500">Score: 94%</p>
                </div>
              </div>

              {/* Floating badge — bottom left */}
              <div className="absolute bottom-5 left-5 z-10 bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2.5 shadow-lg flex items-center gap-2">
                <Database size={16} className="text-blue-500" />
                <div>
                  <p className="text-xs font-bold text-slate-800">24,891 registros</p>
                  <p className="text-xs text-slate-500">Base de datos activa</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
