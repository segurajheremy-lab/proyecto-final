import mongoose, { Document, Schema } from 'mongoose'

export interface IAuditLog extends Document {
  adminId: mongoose.Types.ObjectId
  accion: string
  coleccion: string
  documentoId: mongoose.Types.ObjectId
  cambios: {
    antes: Record<string, unknown>
    despues: Record<string, unknown>
  }
  razon: string
  createdAt: Date
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    accion: { type: String, required: true },      // "EDIT_ATTENDANCE", "DELETE_USER"
    coleccion: { type: String, required: true },   // "attendance", "users"
    documentoId: { type: Schema.Types.ObjectId, required: true },
    cambios: {
      antes: { type: Schema.Types.Mixed, required: true },
      despues: { type: Schema.Types.Mixed, required: true },
    },
    razon: { type: String, required: true },
  },
  { timestamps: true }
)

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', AuditLogSchema)