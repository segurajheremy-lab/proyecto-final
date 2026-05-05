import { Schema, model, Document } from 'mongoose';

// ---------------------------------------------------------------------------
// Interface
// ---------------------------------------------------------------------------

export interface ITenant extends Document {
  nombre: string;
  dominio: string;
  slug: string;
  logo?: string;
  colores: {
    primario: string;
    secundario: string;
  };
  plan: 'trial' | 'starter' | 'pro' | 'enterprise';
  status: 'active' | 'suspended' | 'trial';
  trialExpira: Date;
  agentesLimit: number;
  creadoEn: Date;
  // timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const tenantSchema = new Schema<ITenant>(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    dominio: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    logo: {
      type: String,
    },
    colores: {
      primario: {
        type: String,
        default: '#3B82F6',
      },
      secundario: {
        type: String,
        default: '#1E293B',
      },
    },
    plan: {
      type: String,
      enum: ['trial', 'starter', 'pro', 'enterprise'],
      default: 'trial',
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'trial'],
      default: 'trial',
    },
    trialExpira: {
      type: Date,
      default: () => {
        const date = new Date();
        date.setDate(date.getDate() + 14);
        return date;
      },
    },
    agentesLimit: {
      type: Number,
      default: 10,
    },
    creadoEn: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// ---------------------------------------------------------------------------
// Indexes
// ---------------------------------------------------------------------------

tenantSchema.index({ dominio: 1 }, { unique: true });
tenantSchema.index({ slug: 1 }, { unique: true });

// ---------------------------------------------------------------------------
// Model
// ---------------------------------------------------------------------------

export const Tenant = model<ITenant>('Tenant', tenantSchema);
