import { Schema, model, Document, Types } from 'mongoose';

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

export interface IAttendanceEvento {
  tipo: 'inicio' | 'salida_refrigerio' | 'vuelta_refrigerio' | 'fin';
  timestamp: Date;
  metodo: 'manual' | 'biometria';
}

export interface IAttendance extends Document {
  tenantId: Types.ObjectId;
  userId: Types.ObjectId;
  fecha: string;
  status:
    | 'sin_jornada'
    | 'jornada_activa'
    | 'en_refrigerio'
    | 'post_refrigerio'
    | 'finalizado'
    | 'falta'
    | 'falta_justificada';
  eventos: IAttendanceEvento[];
  tardanza: boolean;
  minutosTardanza: number;
  minutosRefrigerio?: number;
  horasTrabajadas?: number;
  editadoPor?: Types.ObjectId;
  justificacion?: string;
  // timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const attendanceEventoSchema = new Schema<IAttendanceEvento>(
  {
    tipo: {
      type: String,
      enum: ['inicio', 'salida_refrigerio', 'vuelta_refrigerio', 'fin'],
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
    },
    metodo: {
      type: String,
      enum: ['manual', 'biometria'],
      default: 'manual',
    },
  },
  { _id: false }
);

const attendanceSchema = new Schema<IAttendance>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fecha: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: [
        'sin_jornada',
        'jornada_activa',
        'en_refrigerio',
        'post_refrigerio',
        'finalizado',
        'falta',
        'falta_justificada',
      ],
      default: 'sin_jornada',
    },
    eventos: {
      type: [attendanceEventoSchema],
      default: [],
    },
    tardanza: {
      type: Boolean,
      default: false,
    },
    minutosTardanza: {
      type: Number,
      default: 0,
    },
    minutosRefrigerio: {
      type: Number,
    },
    horasTrabajadas: {
      type: Number,
    },
    editadoPor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    justificacion: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// ---------------------------------------------------------------------------
// Indexes
// ---------------------------------------------------------------------------

attendanceSchema.index({ tenantId: 1, userId: 1, fecha: 1 }, { unique: true });

// ---------------------------------------------------------------------------
// Model
// ---------------------------------------------------------------------------

export const Attendance = model<IAttendance>('Attendance', attendanceSchema);
