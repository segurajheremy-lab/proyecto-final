import { Schema, model, Document, Types } from 'mongoose';

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

export interface IClient extends Document {
  tenantId: Types.ObjectId;
  nombre: string;
  apellido: string;
  telefono: string;
  email?: string;
  direccion?: string;
  empresa?: string;
  estado: 'activo' | 'pendiente' | 'resuelto' | 'inactivo';
  creadoPor: Types.ObjectId;
  asignadoA?: Types.ObjectId;
  supervisorId?: Types.ObjectId;
  etiquetas: string[];
  notas?: string;
  ultimaInteraccion?: Date;
  // timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const clientSchema = new Schema<IClient>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    apellido: {
      type: String,
      required: true,
      trim: true,
    },
    telefono: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    direccion: {
      type: String,
    },
    empresa: {
      type: String,
    },
    estado: {
      type: String,
      enum: ['activo', 'pendiente', 'resuelto', 'inactivo'],
      default: 'pendiente',
    },
    creadoPor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    asignadoA: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    supervisorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    etiquetas: {
      type: [String],
      default: [],
    },
    notas: {
      type: String,
    },
    ultimaInteraccion: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// ---------------------------------------------------------------------------
// Indexes
// ---------------------------------------------------------------------------

clientSchema.index({ tenantId: 1, telefono: 1 });
clientSchema.index({ tenantId: 1, asignadoA: 1 });

// ---------------------------------------------------------------------------
// Model
// ---------------------------------------------------------------------------

export const Client = model<IClient>('Client', clientSchema);
