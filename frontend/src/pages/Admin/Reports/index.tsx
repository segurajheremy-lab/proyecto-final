import { useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { descargarExcel, enviarReportePorCorreo } from '../../../services/admin.service'

export default function AdminReports() {
  const { token } = useAuth()
  const [fecha, setFecha] = useState('')
  const [correo, setCorreo] = useState('')
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

  const handleDescargar = async () => {
    if (!fecha) {
      setMensaje({ tipo: 'error', texto: 'Selecciona una fecha primero' })
      return
    }
    try {
      setDownloading(true)
      setMensaje(null)
      await descargarExcel(fecha)
      setMensaje({ tipo: 'ok', texto: 'Reporte descargado exitosamente' })
    } catch {
      setMensaje({ tipo: 'error', texto: 'Error al descargar el reporte' })
    } finally {
      setDownloading(false)
    }
  }

  const handleEnviarCorreo = async () => {
    setMensaje(null)

    if (!fecha || !correo) {
      setMensaje({ tipo: 'error', texto: 'Completa la fecha y el correo' })
      return
    }

    try {
      setLoading(true)
      const data = await enviarReportePorCorreo(fecha, correo)
      setMensaje({ tipo: 'ok', texto: data.message || 'Reporte enviado exitosamente' })
      setFecha('')
      setCorreo('')
    } catch (err: any) {
      setMensaje({
        tipo: 'error',
        texto: err?.response?.data?.message || err?.message || 'Error al enviar el reporte',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Reportes</h1>
        <p className="text-slate-400 text-sm mt-1">
          Genera y envía reportes de asistencia en formato Excel
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card: Descargar Excel */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Descargar Excel</h2>
              <p className="text-xs text-slate-500">Descarga el reporte directamente en tu navegador</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Fecha del reporte</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => { setFecha(e.target.value); setMensaje(null) }}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
              />
            </div>
            <button
              onClick={handleDescargar}
              disabled={downloading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {downloading ? 'Descargando...' : 'Descargar reporte'}
            </button>
          </div>
        </div>

        {/* Card: Enviar por correo */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Enviar por correo</h2>
              <p className="text-xs text-slate-500">Envía el reporte Excel a un correo electrónico</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Fecha del reporte</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => { setFecha(e.target.value); setMensaje(null) }}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Correo destino</label>
              <input
                type="email"
                placeholder="correo@empresa.com"
                value={correo}
                onChange={(e) => { setCorreo(e.target.value); setMensaje(null) }}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
              />
            </div>
            <button
              onClick={handleEnviarCorreo}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:cursor-not-allowed text-white text-sm font-semibold px-6 py-3 rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              {loading ? 'Enviando...' : 'Enviar reporte'}
            </button>
          </div>
        </div>
      </div>

      {/* Mensaje */}
      {mensaje && (
        <div
          className={`px-5 py-4 rounded-xl text-sm font-medium flex items-center gap-3 ${
            mensaje.tipo === 'ok'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}
        >
          {mensaje.tipo === 'ok' ? (
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {mensaje.texto}
        </div>
      )}
    </div>
  )
}
