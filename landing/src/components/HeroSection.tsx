import { useState } from 'react'
import { Bell, ChevronLeft, ChevronRight, Info } from 'lucide-react'

const slides = [
  {
    image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1600&q=80',
    badge: 'TE FORMAMOS PARA QUE LAS EMPRESAS TE PREFIERAN POR ENCIMA DE TODO',
    title: 'Conviértete en un profesional de',
    highlight: 'Call Center',
    titleEnd: 'certificado',
    subtitle: 'Programa intensivo diseñado por expertos del sector con más de 15 años de experiencia formando a los mejores profesionales de atención al cliente.',
    date: '4 DE MAYO',
  },
  {
    image: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=1600&q=80',
    badge: 'CERTIFICACIÓN AVALADA POR LAS PRINCIPALES EMPRESAS DEL SECTOR',
    title: 'Domina las herramientas de',
    highlight: 'IA y Datos',
    titleEnd: 'en tiempo real',
    subtitle: 'Aprende a gestionar equipos, analizar métricas y optimizar la experiencia del cliente con tecnología de vanguardia.',
    date: '18 DE MAYO',
  },
  {
    image: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1600&q=80',
    badge: 'PLAZAS LIMITADAS — INSCRÍBETE ANTES DE QUE SE AGOTEN',
    title: 'Lidera equipos de alto rendimiento en',
    highlight: 'Atención al Cliente',
    titleEnd: 'con IA',
    subtitle: 'Formación práctica con casos reales, simulaciones y mentoring personalizado para acelerar tu carrera profesional.',
    date: '1 DE JUNIO',
  },
]

export default function HeroSection() {
  const [current, setCurrent] = useState(0)

  const prev = () => setCurrent((c) => (c === 0 ? slides.length - 1 : c - 1))
  const next = () => setCurrent((c) => (c === slides.length - 1 ? 0 : c + 1))

  const slide = slides[current]

  return (
    <section className="relative h-screen min-h-[600px] flex items-center overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-700"
        style={{ backgroundImage: `url(${slide.image})` }}
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/65" />

      {/* Arrow left */}
      <button
        onClick={prev}
        className="absolute left-4 md:left-8 z-20 p-2 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
        aria-label="Anterior"
      >
        <ChevronLeft size={28} />
      </button>

      {/* Arrow right */}
      <button
        onClick={next}
        className="absolute right-4 md:right-8 z-20 p-2 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
        aria-label="Siguiente"
      >
        <ChevronRight size={28} />
      </button>

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12">
        <div className="max-w-2xl">
          {/* Badge */}
          <span className="inline-block bg-indigo-600 text-white text-xs font-semibold tracking-wider uppercase px-4 py-2 rounded-full mb-6">
            {slide.badge}
          </span>

          {/* H1 */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-4">
            {slide.title}{' '}
            <span className="text-blue-400">{slide.highlight}</span>{' '}
            {slide.titleEnd}
          </h1>

          {/* Subtitle */}
          <p className="text-slate-300 text-lg md:text-xl mb-10 leading-relaxed">
            {slide.subtitle}
          </p>

          {/* CTA row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Date box */}
            <div className="flex items-center gap-3 bg-black/50 border border-white/20 backdrop-blur-sm text-white px-5 py-3 rounded-xl">
              <Bell size={20} className="text-blue-400 shrink-0" />
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Próximo inicio</p>
                <p className="font-bold text-sm">{slide.date}</p>
              </div>
            </div>

            {/* CTA button */}
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-7 py-3 rounded-xl transition-colors shadow-lg shadow-blue-600/30">
              <Info size={18} />
              Más Información
            </button>
          </div>
        </div>
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              i === current ? 'bg-white w-6' : 'bg-white/40'
            }`}
            aria-label={`Ir a slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  )
}
