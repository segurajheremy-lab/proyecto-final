import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PhoneCall, Menu, X } from 'lucide-react'
import RegistroModal from './RegistroModal'

const navLinks = [
  { label: 'Producto', href: '#' },
  { label: 'Soluciones', href: '#' },
  { label: 'Precios', href: '#' },
  { label: 'Recursos', href: '#' },
  { label: 'Empresa', href: '#' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [showRegistro, setShowRegistro] = useState(false)

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <PhoneCall size={16} className="text-white" />
            </div>
            <span className="font-extrabold text-slate-800 text-lg">CallCenter IA</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors"
              >
                {label}
              </a>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors px-3 py-2 rounded-lg hover:bg-slate-100"
            >
              Iniciar sesión
            </Link>
            <button
              onClick={() => setShowRegistro(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors shadow-md shadow-blue-600/20"
            >
              Comenzar gratis
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-slate-600"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menú"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 px-6 py-4 space-y-3">
            {navLinks.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="block text-slate-700 font-medium py-1"
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </a>
            ))}
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link
                to="/login"
                className="text-slate-600 font-medium text-sm py-2"
                onClick={() => setMenuOpen(false)}
              >
                Iniciar sesión
              </Link>
              <button
                onClick={() => { setMenuOpen(false); setShowRegistro(true) }}
                className="bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg text-center"
              >
                Comenzar gratis
              </button>
            </div>
          </div>
        )}
      </header>

      {showRegistro && (
        <RegistroModal onClose={() => setShowRegistro(false)} />
      )}
    </>
  )
}
