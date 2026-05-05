import { PhoneCall, FileText, ShieldCheck } from 'lucide-react'

const productLinks = ['Dashboard', 'Análisis de Sentimiento', 'Gestión de Roles', 'Reportes', 'API']
const resourceLinks = [
  { label: 'Documentación', icon: FileText },
  { label: 'Guía de inicio rápido', icon: FileText },
  { label: 'Política de privacidad', icon: ShieldCheck },
  { label: 'Términos de servicio', icon: ShieldCheck },
]
const companyLinks = ['Sobre nosotros', 'Blog', 'Carreras', 'Prensa', 'Contacto']

export default function Footer() {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 pt-16 pb-8 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Col 1 — Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <PhoneCall size={16} className="text-white" />
              </div>
              <span className="text-white font-extrabold text-lg">CallCenter IA</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Plataforma SaaS multi-tenant para la gestión inteligente de call centers.
              Potenciada por IA y datos en tiempo real.
            </p>
          </div>

          {/* Col 2 — Producto */}
          <div>
            <h5 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Producto</h5>
            <ul className="space-y-2.5">
              {productLinks.map((link) => (
                <li key={link}>
                  <a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Recursos */}
          <div>
            <h5 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Recursos</h5>
            <ul className="space-y-2.5">
              {resourceLinks.map(({ label, icon: Icon }) => (
                <li key={label}>
                  <a href="#" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
                    <Icon size={13} className="shrink-0" />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4 — Empresa */}
          <div>
            <h5 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Empresa</h5>
            <ul className="space-y-2.5">
              {companyLinks.map((link) => (
                <li key={link}>
                  <a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-xs">
            © {new Date().getFullYear()} CallCenter IA. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 bg-green-900/40 text-green-400 text-xs font-semibold px-3 py-1.5 rounded-full border border-green-800/50">
              <ShieldCheck size={12} />
              Certificado SOC 2 Type II
            </span>
            <span className="flex items-center gap-1.5 bg-green-900/40 text-green-400 text-xs font-semibold px-3 py-1.5 rounded-full border border-green-800/50">
              <ShieldCheck size={12} />
              GDPR Compliant
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
