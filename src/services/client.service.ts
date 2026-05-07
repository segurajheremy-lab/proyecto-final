import { Types } from 'mongoose';
import { Client } from '../models/Client.model';
import { User } from '../models/User.model';
import { Interaction } from '../models/Interaction.model';
import { AuditLog } from '../models/AuditLog.model';
import { AppError } from '../middlewares/errorHandler.middleware';
import type {
  CrearClienteInput,
  ActualizarClienteInput,
  FiltrosClienteInput,
} from '../validators/client.validator';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Verifies that agenteId is an active agent in the tenant */
async function verificarAgente(agenteId: string, tenantId: string) {
  const agente = await User.findOne({
    _id: agenteId,
    tenantId,
    role: 'agent',
    activo: true,
  }).lean();

  if (!agente) {
    throw new AppError('El agente no existe, no pertenece a este tenant o está inactivo.', 404);
  }
  return agente;
}

/** Verifies that the agent reports to the given supervisor */
async function verificarAgenteDeSupervisor(agenteId: string, supervisorId: string) {
  const agente = await User.findOne({
    _id: agenteId,
    supervisorId,
  }).lean();

  if (!agente) {
    throw new AppError('El agente no reporta a este supervisor.', 403);
  }
  return agente;
}

// ---------------------------------------------------------------------------
// 1. crearClienteService
// ---------------------------------------------------------------------------

export async function crearClienteService(
  data: CrearClienteInput,
  creadorId: string,
  tenantId: string
) {
  // DEBUG: Log input data
  console.log('[crearClienteService] Input data:', { ...data, tenantId, creadorId });

  // Verify asignadoA if provided and not empty
  const asignadoA = data.asignadoA && data.asignadoA.trim() ? data.asignadoA : undefined;
  
  if (asignadoA) {
    await verificarAgente(asignadoA, tenantId);
    await verificarAgenteDeSupervisor(asignadoA, creadorId);
  }

  const cliente = await Client.create({
    ...data,
    asignadoA: asignadoA || undefined,
    tenantId,
    creadoPor:       creadorId,
    supervisorId:    creadorId,
    ultimaInteraccion: asignadoA ? new Date() : undefined,
  });

  const result = await Client.findById(cliente._id)
    .populate('creadoPor', 'nombre email role')
    .populate('asignadoA', 'nombre email role')
    .lean();

  console.log('[crearClienteService] Cliente created successfully:', result?._id);

  return result;
}

// ---------------------------------------------------------------------------
// 2. listarClientesService
// ---------------------------------------------------------------------------

export async function listarClientesService(
  filtros: FiltrosClienteInput,
  userId: string,
  role: string,
  tenantId: string
) {
  const { estado, asignadoA, busqueda, pagina, limite } = filtros;
  const skip = (pagina - 1) * limite;

  // CRITICAL: Base filter — always scoped to tenant BEFORE any other filters
  const filter: Record<string, unknown> = { tenantId };

  // Role-based scope (AFTER tenantId is set)
  if (role === 'agent') {
    filter.asignadoA = userId;
  } else if (role === 'supervisor') {
    // Get all agents under this supervisor
    const agentes = await User.find({ tenantId, supervisorId: userId, role: 'agent' })
      .select('_id')
      .lean();
    filter.asignadoA = { $in: agentes.map((a) => a._id) };
  }
  // sub_admin, admin, owner → no additional scope filter

  // Optional filters
  if (estado) filter.estado = estado;
  if (asignadoA && role !== 'agent') filter.asignadoA = asignadoA;

  // Text search across nombre, apellido, telefono, email
  if (busqueda) {
    const regex = new RegExp(busqueda.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [
      { nombre: regex },
      { apellido: regex },
      { telefono: regex },
      { email: regex },
      { empresa: regex },
    ];
  }

  // DEBUG: Log final filter before executing query
  console.log('[listarClientesService] Final filter:', JSON.stringify(filter, null, 2));

  const [clientes, total] = await Promise.all([
    Client.find(filter)
      .populate('asignadoA', 'nombre email')
      .populate('creadoPor', 'nombre email')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limite)
      .lean(),
    Client.countDocuments(filter),
  ]);

  console.log(`[listarClientesService] Found ${clientes.length} clients out of ${total} total`);

  return {
    clientes,
    total,
    pagina,
    totalPaginas: Math.ceil(total / limite),
  };
}

// ---------------------------------------------------------------------------
// 3. obtenerClienteService
// ---------------------------------------------------------------------------

export async function obtenerClienteService(
  clientId: string,
  userId: string,
  role: string,
  tenantId: string
) {
  const cliente = await Client.findOne({ _id: clientId, tenantId })
    .populate('creadoPor', 'nombre email role')
    .populate('asignadoA', 'nombre email role')
    .populate('supervisorId', 'nombre email')
    .lean();

  if (!cliente) throw new AppError('Cliente no encontrado.', 404);

  // Role-based access check
  if (role === 'agent') {
    if (String(cliente.asignadoA?._id ?? cliente.asignadoA) !== userId) {
      throw new AppError('No tienes acceso a este cliente.', 403);
    }
  } else if (role === 'supervisor') {
    const agentes = await User.find({ tenantId, supervisorId: userId }).select('_id').lean();
    const agenteIds = agentes.map((a) => String(a._id));
    const asignadoId = String(cliente.asignadoA?._id ?? cliente.asignadoA ?? '');
    if (asignadoId && !agenteIds.includes(asignadoId)) {
      throw new AppError('No tienes acceso a este cliente.', 403);
    }
  }

  // Last 5 interactions
  const ultimasInteracciones = await Interaction.find({ tenantId, clientId })
    .populate('agentId', 'nombre email')
    .sort({ fecha: -1 })
    .limit(5)
    .lean();

  return { ...cliente, ultimasInteracciones };
}

// ---------------------------------------------------------------------------
// 4. actualizarClienteService
// ---------------------------------------------------------------------------

export async function actualizarClienteService(
  clientId: string,
  data: ActualizarClienteInput,
  userId: string,
  role: string,
  tenantId: string
) {
  const cliente = await Client.findOne({ _id: clientId, tenantId }).lean();
  if (!cliente) throw new AppError('Cliente no encontrado.', 404);

  let updates: Partial<ActualizarClienteInput> = {};

  if (role === 'agent') {
    // Agent can only update their own clients' notes and tags
    if (String(cliente.asignadoA) !== userId) {
      throw new AppError('Solo puedes editar clientes asignados a ti.', 403);
    }
    updates = {
      ...(data.notas !== undefined && { notas: data.notas }),
      ...(data.etiquetas !== undefined && { etiquetas: data.etiquetas }),
    };
  } else if (role === 'supervisor') {
    // Supervisor can update all fields of their clients
    const agentes = await User.find({ tenantId, supervisorId: userId }).select('_id').lean();
    const agenteIds = agentes.map((a) => String(a._id));
    if (String(cliente.asignadoA) && !agenteIds.includes(String(cliente.asignadoA))) {
      throw new AppError('No tienes acceso a este cliente.', 403);
    }
    updates = data;
  } else {
    // admin / sub_admin / owner — full update + audit log
    const camposImportantes = ['nombre', 'apellido', 'telefono', 'email'] as const;
    const hayDatosCriticos = camposImportantes.some(
      (k) => data[k] !== undefined && data[k] !== (cliente as Record<string, unknown>)[k]
    );

    if (hayDatosCriticos) {
      await AuditLog.create({
        tenantId,
        adminId:    userId,
        accion:     'EDIT_CLIENT',
        coleccion:  'clients',
        documentoId: clientId,
        cambios: {
          antes:   Object.fromEntries(camposImportantes.map((k) => [k, (cliente as Record<string, unknown>)[k]])),
          despues: Object.fromEntries(camposImportantes.filter((k) => data[k] !== undefined).map((k) => [k, data[k]])),
        },
        razon: 'Actualización de datos del cliente por administrador',
      });
    }
    updates = data;
  }

  const actualizado = await Client.findByIdAndUpdate(
    clientId,
    { $set: updates },
    { new: true, runValidators: true }
  )
    .populate('asignadoA', 'nombre email role')
    .populate('creadoPor', 'nombre email role')
    .lean();

  return actualizado;
}

// ---------------------------------------------------------------------------
// 5. asignarClienteService
// ---------------------------------------------------------------------------

export async function asignarClienteService(
  clientId: string,
  agenteId: string,
  supervisorId: string,
  tenantId: string
) {
  const cliente = await Client.findOne({ _id: clientId, tenantId }).lean();
  if (!cliente) throw new AppError('Cliente no encontrado.', 404);

  // Verify agent belongs to this tenant and reports to this supervisor
  await verificarAgente(agenteId, tenantId);
  await verificarAgenteDeSupervisor(agenteId, supervisorId);

  const actualizado = await Client.findByIdAndUpdate(
    clientId,
    {
      $set: {
        asignadoA:         agenteId,
        supervisorId:      supervisorId,
        ultimaInteraccion: new Date(),
      },
    },
    { new: true }
  )
    .populate('asignadoA', 'nombre email role')
    .populate('creadoPor', 'nombre email role')
    .lean();

  return actualizado;
}

// ---------------------------------------------------------------------------
// 6. cambiarEstadoClienteService
// ---------------------------------------------------------------------------

export async function cambiarEstadoClienteService(
  clientId: string,
  estado: 'activo' | 'pendiente' | 'resuelto' | 'inactivo',
  userId: string,
  role: string,
  tenantId: string
) {
  const cliente = await Client.findOne({ _id: clientId, tenantId }).lean();
  if (!cliente) throw new AppError('Cliente no encontrado.', 404);

  // Agent can only change their own clients to resuelto or pendiente
  if (role === 'agent') {
    if (String(cliente.asignadoA) !== userId) {
      throw new AppError('Solo puedes cambiar el estado de tus clientes asignados.', 403);
    }
    if (!['resuelto', 'pendiente'].includes(estado)) {
      throw new AppError('Los agentes solo pueden cambiar el estado a "resuelto" o "pendiente".', 403);
    }
  }

  const actualizado = await Client.findByIdAndUpdate(
    clientId,
    { $set: { estado } },
    { new: true }
  )
    .populate('asignadoA', 'nombre email role')
    .lean();

  return actualizado;
}

// ---------------------------------------------------------------------------
// 7. eliminarClienteService (soft delete)
// ---------------------------------------------------------------------------

export async function eliminarClienteService(
  clientId: string,
  adminId: string,
  tenantId: string
) {
  const cliente = await Client.findOne({ _id: clientId, tenantId }).lean();
  if (!cliente) throw new AppError('Cliente no encontrado.', 404);

  // Soft delete — set estado to inactivo
  await Client.findByIdAndUpdate(clientId, { $set: { estado: 'inactivo' } });

  // Audit log
  await AuditLog.create({
    tenantId,
    adminId,
    accion:     'DELETE_CLIENT',
    coleccion:  'clients',
    documentoId: new Types.ObjectId(clientId),
    cambios: {
      antes:   { estado: cliente.estado },
      despues: { estado: 'inactivo' },
    },
    razon: 'Eliminación lógica de cliente por administrador',
  });

  return { message: 'Cliente desactivado correctamente.' };
}
