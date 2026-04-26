export type AttendanceStatus =
  | 'sin_jornada'
  | 'jornada_activa'
  | 'en_refrigerio'
  | 'post_refrigerio'
  | 'finalizado'
  | 'falta'
  | 'falta_justificada'

export type EventType =
  | 'inicio'
  | 'salida_refrigerio'
  | 'vuelta_refrigerio'
  | 'fin'

export interface IAttendanceEvent {
  tipo: EventType
  timestamp: string
  metodo: 'manual' | 'biometria'
}

export interface IAttendanceState {
  status: AttendanceStatus
  fecha: string
  tardanza?: boolean
  minutosTardanza?: number
  minutosRefrigerio?: number | null
  horasTrabajadas?: number | null
  eventos: IAttendanceEvent[]
}