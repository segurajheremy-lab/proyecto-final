import { createContext, useContext, useState, ReactNode } from 'react'
import { IAttendanceState } from '../types/attendance.types'
import {
  obtenerEstadoHoy,
  iniciarJornada,
  salirRefrigerio,
  volverRefrigerio,
  finalizarJornada,
} from '../services/attendance.service'

interface AttendanceContextType {
  estado: IAttendanceState | null
  isLoading: boolean
  error: string | null
  cargarEstado: () => Promise<void>
  handleIniciarJornada: () => Promise<void>
  handleSalirRefrigerio: () => Promise<void>
  handleVolverRefrigerio: () => Promise<void>
  handleFinalizarJornada: () => Promise<void>
}

const AttendanceContext = createContext<AttendanceContextType>({
  estado: null,
  isLoading: false,
  error: null,
  cargarEstado: async () => {},
  handleIniciarJornada: async () => {},
  handleSalirRefrigerio: async () => {},
  handleVolverRefrigerio: async () => {},
  handleFinalizarJornada: async () => {},
})

export const AttendanceProvider = ({ children }: { children: ReactNode }) => {
  const [estado, setEstado] = useState<IAttendanceState | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const cargarEstado = async (): Promise<void> => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await obtenerEstadoHoy()
      setEstado(data)
    } catch {
      setError('Error al cargar estado de asistencia')
    } finally {
      setIsLoading(false)
    }
  }

  const ejecutarAccion = async (accion: () => Promise<unknown>): Promise<void> => {
    try {
      setIsLoading(true)
      setError(null)
      await accion()
      await cargarEstado()
    } catch (err: unknown) {
      const mensaje = err instanceof Error ? err.message : 'Error inesperado'
      setError(mensaje)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AttendanceContext.Provider
      value={{
        estado,
        isLoading,
        error,
        cargarEstado,
        handleIniciarJornada: () => ejecutarAccion(iniciarJornada),
        handleSalirRefrigerio: () => ejecutarAccion(salirRefrigerio),
        handleVolverRefrigerio: () => ejecutarAccion(volverRefrigerio),
        handleFinalizarJornada: () => ejecutarAccion(finalizarJornada),
      }}
    >
      {children}
    </AttendanceContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAttendance = (): AttendanceContextType => {
  return useContext(AttendanceContext)
}