import { format } from 'date-fns'

// Obtiene fecha actual en formato "2024-01-15"
export const getFechaHoy = (): string => {
  return format(new Date(), 'yyyy-MM-dd')
}

// Convierte "08:00" a minutos totales → 480
export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

// Calcula minutos de diferencia entre dos timestamps
export const diffMinutes = (start: Date, end: Date): number => {
  return Math.floor((end.getTime() - start.getTime()) / 60000)
}

// Verifica si hay tardanza y cuántos minutos
export const calcularTardanza = (
  timestampEntrada: Date,
  horaEntradaEsperada: string,
  toleranciaMinutos: number
): { tardanza: boolean; minutosTardanza: number } => {
  const [horas, minutos] = horaEntradaEsperada.split(':').map(Number)

  const entradaEsperada = new Date(timestampEntrada)
  entradaEsperada.setHours(horas, minutos, 0, 0)

  const limiteConTolerancia = new Date(entradaEsperada)
  limiteConTolerancia.setMinutes(limiteConTolerancia.getMinutes() + toleranciaMinutos)

  if (timestampEntrada <= limiteConTolerancia) {
    return { tardanza: false, minutosTardanza: 0 }
  }

  const minutosTardanza = diffMinutes(limiteConTolerancia, timestampEntrada)
  return { tardanza: true, minutosTardanza }
}

// Calcula horas trabajadas descontando refrigerio
export const calcularHorasTrabajadas = (
  inicio: Date,
  fin: Date,
  minutosRefrigerio: number
): number => {
  const totalMinutos = diffMinutes(inicio, fin)
  const minutosTrabajados = totalMinutos - minutosRefrigerio
  return Math.round((minutosTrabajados / 60) * 100) / 100 // 2 decimales
}