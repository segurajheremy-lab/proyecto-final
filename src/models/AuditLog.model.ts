import { Schema, model, Document, Types } from 'mongoose';

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

export interface IAuditLogCambios {
  antes?: unknown;
  despues?: unknown;
}

export interface IAuditLog extends Document {
  tenantId: Types.ObjectId;
  adminId: Types.ObjectId;
  accion: string;
  coleccion: string;
  documentoId: Types.ObjectId;
  cambios: IAuditLogCambios;
  razon: string;
  creadoEn: Date;
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const auditLogSchema = new Schema<IAuditLog>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    accion: {
      type: String,
      required: true,
    },
    coleccion: {
      type: String,
      required: true,
    },
    documentoId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    cambios: {
      antes: { type: Schema.Types.Mixed },
      despues: { type: Schema.Types.Mixed },
    },
    razon: {
      type: String,
      required: true,
    },
    creadoEn: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // No timestamps: true — uses its own creadoEn field
    timestamps: false,
  }
);

// ---------------------------------------------------------------------------
// Model
// ---------------------------------------------------------------------------

export const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);
