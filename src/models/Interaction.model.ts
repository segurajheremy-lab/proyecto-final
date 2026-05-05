import { Schema, model, Document, Types } from 'mongoose';

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

export interface IInteraction extends Document {
  tenantId: Types.ObjectId;
  clientId: Types.ObjectId;
  agentId: Types.ObjectId;
  fecha: Date;
  duracionMinutos?: number;
  resultado: 'resuelto' | 'pendiente' | 'sin_respuesta' | 'callback';
  nota: string;
  sentimiento?: 'positivo' | 'neutral' | 'negativo';
  sentimientoScore?: number;
  alertaEnviada: boolean;
  // timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const interactionSchema = new Schema<IInteraction>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    agentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fecha: {
      type: Date,
      default: Date.now,
    },
    duracionMinutos: {
      type: Number,
    },
    resultado: {
      type: String,
      enum: ['resuelto', 'pendiente', 'sin_respuesta', 'callback'],
      required: true,
    },
    nota: {
      type: String,
      required: true,
    },
    sentimiento: {
      type: String,
      enum: ['positivo', 'neutral', 'negativo'],
    },
    sentimientoScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    alertaEnviada: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// ---------------------------------------------------------------------------
// Indexes
// ---------------------------------------------------------------------------

interactionSchema.index({ tenantId: 1, clientId: 1 });
interactionSchema.index({ tenantId: 1, agentId: 1 });
interactionSchema.index({ tenantId: 1, fecha: 1 });

// ---------------------------------------------------------------------------
// Model
// ---------------------------------------------------------------------------

export const Interaction = model<IInteraction>('Interaction', interactionSchema);
