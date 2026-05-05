import { Schema, model, Document, Types } from 'mongoose';

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

export interface IUserHorario {
  entrada?: string;
  salidaRefrigerio?: string;
  vueltaRefrigerio?: string;
  salida?: string;
}

export interface IUser extends Document {
  tenantId: Types.ObjectId;
  nombre: string;
  email: string;
  passwordHash: string;
  role: 'super_admin' | 'owner' | 'admin' | 'sub_admin' | 'supervisor' | 'agent';
  horario?: IUserHorario;
  toleranciaMinutos: number;
  supervisorId?: Types.ObjectId;
  subAdminId?: Types.ObjectId;
  activo: boolean;
  ultimoLogin?: Date;
  // timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const userSchema = new Schema<IUser>(
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
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['super_admin', 'owner', 'admin', 'sub_admin', 'supervisor', 'agent'],
      required: true,
    },
    horario: {
      entrada: { type: String },
      salidaRefrigerio: { type: String },
      vueltaRefrigerio: { type: String },
      salida: { type: String },
    },
    toleranciaMinutos: {
      type: Number,
      default: 10,
    },
    supervisorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    subAdminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    activo: {
      type: Boolean,
      default: true,
    },
    ultimoLogin: {
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

// Same email can exist in different tenants, but must be unique within one
userSchema.index({ tenantId: 1, email: 1 }, { unique: true });

// ---------------------------------------------------------------------------
// Model
// ---------------------------------------------------------------------------

export const User = model<IUser>('User', userSchema);
