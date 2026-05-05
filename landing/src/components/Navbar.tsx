import { useState } from 'react'
import { PhoneCall, Menu, X } from 'lucide-react'

const navLinks = ['Producto', 'Soluciones', 'Precios', 'Recursos', 'Empresa']

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <PhoneCall size={16} className="text-white" />
          </div>
          <span className="font-extrabold text-slate-800 text-lg">CallCenter IA</span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => (
            <a
              key={link}
              href="#"
              className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors"
            >
              {link}
            </a>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <a href="#" className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors">
            Iniciar sesión
          </a>
          <a
            href="#"
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors shadow-md shadow-blue-600/20"
          >
            Comenzar gratis
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-slate-600"
          onClick={() => setOpen(!open)}
          aria-label="Menú"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-slate-100 px-6 py-4 space-y-3">
          {navLinks.map((link) => (
            <a
              key={link}
              href="#"
              className="block text-slate-700 font-medium py-1"
              onClick={() => setOpen(false)}
            >
              {link}
            </a>
          ))}
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <a href="#" className="text-slate-600 font-medium text-sm">Iniciar sesión</a>
            <a href="#" className="bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg text-center">
              Comenzar gratis
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
