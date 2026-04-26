import mongoose, { Document, Schema } from 'mongoose'

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
  timestamp: Date
  metodo: 'manual' | 'biometria'
}

export interface IAttendance extends Document {
  userId: mongoose.Types.ObjectId
  fecha: string                    // "2024-01-15" — string para consultas fáciles
  status: AttendanceStatus
  eventos: IAttendanceEvent[]
  tardanza: boolean
  minutosTardanza: number
  minutosRefrigerio: number | null
  horasTrabajadas: number | null
  editadoPor: mongoose.Types.ObjectId | null
  createdAt: Date
  updatedAt: Date
}

const AttendanceEventSchema = new Schema<IAttendanceEvent>(
  {
    tipo: {
      type: String,
      enum: ['inicio', 'salida_refrigerio', 'vuelta_refrigerio', 'fin'],
      required: true,
    },
    timestamp: { type: Date, required: true },
    metodo: { type: String, enum: ['manual', 'biometria'], default: 'manual' },
  },
  { _id: false }
)

const AttendanceSchema = new Schema<IAttendance>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    fecha: { type: String, required: true },
    status: {
      type: String,
      enum: ['sin_jornada', 'jornada_activa', 'en_refrigerio', 'post_refrigerio', 'finalizado', 'falta', 'falta_justificada'],
      default: 'sin_jornada',
    },
    eventos: [AttendanceEventSchema],
    tardanza: { type: Boolean, default: false },
    minutosTardanza: { type: Number, default: 0 },
    minutosRefrigerio: { type: Number, default: null },
    horasTrabajadas: { type: Number, default: null },
    editadoPor: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
)

// Índice compuesto — búsqueda rápida por usuario y fecha
AttendanceSchema.index({ userId: 1, fecha: 1 }, { unique: true })

export const Attendance = mongoose.model<IAttendance>('Attendance', AttendanceSchema)