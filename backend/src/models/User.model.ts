import mongoose, { Document, Schema } from 'mongoose'
import { Role } from '../config/permissions'

export interface IUser extends Document {
  nombre: string
  email: string
  passwordHash: string
  role: Role
  horario: {
    entrada: string        // "08:00"
    salidaRefrigerio: string  // "13:00"
    vueltaRefrigerio: string  // "14:00"
    salida: string         // "17:00"
  }
  toleranciaMinutos: number
  activo: boolean
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    nombre: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['super_admin', 'admin', 'reporter', 'worker'],
      required: true,
    },
    horario: {
      entrada: { type: String, required: true },
      salidaRefrigerio: { type: String, required: true },
      vueltaRefrigerio: { type: String, required: true },
      salida: { type: String, required: true },
    },
    toleranciaMinutos: { type: Number, default: 10 },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export const User = mongoose.model<IUser>('User', UserSchema)