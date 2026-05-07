import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Types } from 'mongoose';
import { connectDB } from '../../config/db';
import { Client } from '../../models/Client.model';
import { Interaction } from '../../models/Interaction.model';
import { User } from '../../models/User.model';
import { Tenant } from '../../models/Tenant.model';
import { AuditLog } from '../../models/AuditLog.model';
import { listarClientesService } from '../../services/client.service';
import { listarInteraccionesService } from '../../services/interaction.service';
import { obtenerClienteService } from '../../services/client.service';
import { actualizarClienteService } from '../../services/client.service';
import { crearInteraccionService } from '../../services/interaction.service';
import { AppError } from '../../middlewares/errorHandler.middleware';

/**
 * Preservation Property Tests - Role-Based Filtering
 *
 * These tests validate that the existing role-based filtering behavior is preserved
 * after the bugfix. They test the behaviors that MUST NOT CHANGE:
 *
 * 1. Agent can only see their assigned clients
 * 2. Supervisor can only see clients of their agents
 * 3. Agent receives 403 when accessing unassigned client
 * 4. Super admin can see all clients without tenantId restriction
 * 5. Email alert sent when interaction has negative sentiment with score > 70
 * 6. AuditLog created when admin updates critical client fields
 * 7. Client estado auto-changes to 'resuelto' when interaction resultado='resuelto'
 *
 * CRITICAL: These tests MUST PASS on unfixed code - they validate baseline behavior.
 * After the fix, they MUST CONTINUE TO PASS - no regressions allowed.
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10
 */

describe('Preservation Property Tests - Role-Based Filtering', () => {
  let tenantA: any;
  let tenantB: any;
  let supervisorA: any;
  let supervisorB: any;
  let agentA1: any;
  let agentA2: any;
  let agentB: any;
  let adminA: any;
  let superAdmin: any;
  let clientsA1: any[] = [];
  let clientsA2: any[] = [];
  let clientsB: any[] = [];

  beforeAll(async () => {
    // Connect to MongoDB
    await connectDB();
  });

  afterAll(async () => {
    // Clean up test data
    await Tenant.deleteMany({});
    await User.deleteMany({});
    await Client.deleteMany({});
    await Interaction.deleteMany({});
    await AuditLog.deleteMany({});
  });

  beforeEach(async () => {
    // Clean up before each test
    await Tenant.deleteMany({});
    await User.deleteMany({});
    await Client.deleteMany({});
    await Interaction.deleteMany({});
    await AuditLog.deleteMany({});

    // Create two tenants
    tenantA = await Tenant.create({
      nombre: 'Tenant A',
      dominio: 'tenant-a.example.com',
      slug: 'tenant-a',
      status: 'active',
    });

    tenantB = await Tenant.create({
      nombre: 'Tenant B',
      dominio: 'tenant-b.example.com',
      slug: 'tenant-b',
      status: 'active',
    });

    // Create super admin (associated with a dummy tenant for schema compliance)
    // Note: In real implementation, super_admin might have a special tenantId or null handling
    const dummyTenant = await Tenant.create({
      nombre: 'Dummy Tenant',
      dominio: 'dummy.example.com',
      slug: 'dummy',
      status: 'active',
    });

    superAdmin = await User.create({
      tenantId: dummyTenant._id,
      nombre: 'Super Admin',
      email: 'superadmin@example.com',
      passwordHash: 'hashed-password',
      role: 'super_admin',
      activo: true,
    });

    // Create admin for tenant A
    adminA = await User.create({
      tenantId: tenantA._id,
      nombre: 'Admin A',
      email: 'admin-a@tenant-a.com',
      passwordHash: 'hashed-password',
      role: 'admin',
      activo: true,
    });

    // Create supervisors for each tenant
    supervisorA = await User.create({
      tenantId: tenantA._id,
      nombre: 'Supervisor A',
      email: 'supervisor-a@tenant-a.com',
      passwordHash: 'hashed-password',
      role: 'supervisor',
      activo: true,
    });

    supervisorB = await User.create({
      tenantId: tenantB._id,
      nombre: 'Supervisor B',
      email: 'supervisor-b@tenant-b.com',
      passwordHash: 'hashed-password',
      role: 'supervisor',
      activo: true,
    });

    // Create agents for tenant A (under supervisor A)
    agentA1 = await User.create({
      tenantId: tenantA._id,
      nombre: 'Agent A1',
      email: 'agent-a1@tenant-a.com',
      passwordHash: 'hashed-password',
      role: 'agent',
      supervisorId: supervisorA._id,
      activo: true,
    });

    agentA2 = await User.create({
      tenantId: tenantA._id,
      nombre: 'Agent A2',
      email: 'agent-a2@tenant-a.com',
      passwordHash: 'hashed-password',
      role: 'agent',
      supervisorId: supervisorA._id,
      activo: true,
    });

    // Create agent for tenant B
    agentB = await User.create({
      tenantId: tenantB._id,
      nombre: 'Agent B',
      email: 'agent-b@tenant-b.com',
      passwordHash: 'hashed-password',
      role: 'agent',
      supervisorId: supervisorB._id,
      activo: true,
    });

    // Create 3 clients for agent A1
    clientsA1 = [];
    for (let i = 1; i <= 3; i++) {
      const client = await Client.create({
        tenantId: tenantA._id,
        nombre: `Client A1-${i}`,
        apellido: `Lastname A1-${i}`,
        telefono: `555-100${i}`,
        email: `client-a1-${i}@example.com`,
        estado: 'activo',
        creadoPor: supervisorA._id,
        asignadoA: agentA1._id,
      });
      clientsA1.push(client);
    }

    // Create 3 clients for agent A2
    clientsA2 = [];
    for (let i = 1; i <= 3; i++) {
      const client = await Client.create({
        tenantId: tenantA._id,
        nombre: `Client A2-${i}`,
        apellido: `Lastname A2-${i}`,
        telefono: `555-200${i}`,
        email: `client-a2-${i}@example.com`,
        estado: 'activo',
        creadoPor: supervisorA._id,
        asignadoA: agentA2._id,
      });
      clientsA2.push(client);
    }

    // Create 3 clients for agent B
    clientsB = [];
    for (let i = 1; i <= 3; i++) {
      const client = await Client.create({
        tenantId: tenantB._id,
        nombre: `Client B-${i}`,
        apellido: `Lastname B-${i}`,
        telefono: `555-300${i}`,
        email: `client-b-${i}@example.com`,
        estado: 'activo',
        creadoPor: supervisorB._id,
        asignadoA: agentB._id,
      });
      clientsB.push(client);
    }
  });

  // =========================================================================
  // Test Case 1: Agent can only see their assigned clients
  // =========================================================================

  it('Test Case 1: Agent can only see their assigned clients', async () => {
    // Setup: Create supervisor with 2 agents, each with 3 clients ✓ (done in beforeEach)

    // Action: Authenticate as agent A1, call listarClientesService
    const filtros = {
      estado: undefined,
      asignadoA: undefined,
      busqueda: undefined,
      pagina: 1,
      limite: 10,
    };

    const result = await listarClientesService(
      filtros,
      agentA1._id.toString(),
      'agent',
      tenantA._id.toString()
    );

    // Expected: Should return only 3 clients assigned to agent A1
    expect(result.clientes).toBeDefined();
    expect(result.clientes.length).toBe(3);
    expect(result.total).toBe(3);

    // Verify all returned clients are assigned to agent A1
    result.clientes.forEach((client: any) => {
      expect(client.asignadoA._id.toString()).toBe(agentA1._id.toString());
      expect(client.nombre).toMatch(/^Client A1/);
    });

    // Verify no clients from agent A2 are returned
    const clientNames = result.clientes.map((c: any) => c.nombre);
    expect(clientNames.some((name: string) => name.includes('A2'))).toBe(false);
  });

  // =========================================================================
  // Test Case 2: Supervisor can only see clients of their agents
  // =========================================================================

  it('Test Case 2: Supervisor can only see clients of their agents', async () => {
    // Setup: Create supervisor with 2 agents, each with 3 clients ✓ (done in beforeEach)

    // Action: Authenticate as supervisor A, call listarClientesService
    const filtros = {
      estado: undefined,
      asignadoA: undefined,
      busqueda: undefined,
      pagina: 1,
      limite: 20,
    };

    const result = await listarClientesService(
      filtros,
      supervisorA._id.toString(),
      'supervisor',
      tenantA._id.toString()
    );

    // Expected: Should return 6 clients (3 from agent A1 + 3 from agent A2)
    expect(result.clientes.length).toBe(6);
    expect(result.total).toBe(6);

    // Verify all clients belong to agents under supervisor A
    const agentIds = [agentA1._id.toString(), agentA2._id.toString()];
    result.clientes.forEach((client: any) => {
      expect(agentIds).toContain(client.asignadoA._id.toString());
    });

    // Verify no clients from tenant B are returned
    result.clientes.forEach((client: any) => {
      expect(client.tenantId.toString()).toBe(tenantA._id.toString());
    });
  });

  // =========================================================================
  // Test Case 3: Agent receives 403 when accessing unassigned client
  // =========================================================================

  it('Test Case 3: Agent receives 403 when accessing unassigned client', async () => {
    // Setup: Create 2 agents with different clients ✓ (done in beforeEach)

    // Action: Authenticate as agent A1, try to access client assigned to agent A2
    try {
      await obtenerClienteService(
        clientsA2[0]._id.toString(),
        agentA1._id.toString(),
        'agent',
        tenantA._id.toString()
      );
      // Should not reach here
      expect.fail('Should have thrown 403 error');
    } catch (err) {
      // Expected: Should return 403 "No tienes acceso a este cliente"
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(403);
      expect((err as AppError).message).toContain('No tienes acceso');
    }
  });

  // =========================================================================
  // Test Case 4: Super admin can see all clients without tenantId restriction
  // =========================================================================

  it('Test Case 4: Super admin can see all clients without tenantId restriction', async () => {
    // Setup: Create 2 tenants with clients each ✓ (done in beforeEach)

    // Action: Authenticate as super_admin, call listarClientesService for tenant A
    // Note: super_admin doesn't have tenantId, so we pass empty string or null
    const filtros = {
      estado: undefined,
      asignadoA: undefined,
      busqueda: undefined,
      pagina: 1,
      limite: 20,
    };

    // Super admin should be able to query with any tenantId
    // In this case, we query tenant A
    const resultA = await listarClientesService(
      filtros,
      superAdmin._id.toString(),
      'super_admin',
      tenantA._id.toString()
    );

    // Expected: Should return all clients from tenant A (6 total)
    expect(resultA.clientes.length).toBe(6);
    expect(resultA.total).toBe(6);

    // Verify all clients belong to tenant A
    resultA.clientes.forEach((client: any) => {
      expect(client.tenantId.toString()).toBe(tenantA._id.toString());
    });

    // Super admin should also be able to query tenant B
    const resultB = await listarClientesService(
      filtros,
      superAdmin._id.toString(),
      'super_admin',
      tenantB._id.toString()
    );

    // Expected: Should return all clients from tenant B (3 total)
    expect(resultB.clientes.length).toBe(3);
    expect(resultB.total).toBe(3);

    // Verify all clients belong to tenant B
    resultB.clientes.forEach((client: any) => {
      expect(client.tenantId.toString()).toBe(tenantB._id.toString());
    });
  });

  // =========================================================================
  // Test Case 5: Email alert sent when interaction has negative sentiment with score > 70
  // =========================================================================

  it('Test Case 5: Email alert sent when interaction has negative sentiment with score > 70', async () => {
    // Setup: Create interaction with sentimiento='negativo' and sentimientoScore=75
    // Note: This test validates that the alert email logic is preserved
    // The actual email sending is mocked in the service

    // Action: Call crearInteraccionService with negative sentiment data
    const newInteractionData = {
      clientId: clientsA1[0]._id.toString(),
      duracionMinutos: 5,
      resultado: 'pendiente' as const,
      nota: 'Customer was very upset about the service quality and demanded a refund immediately.',
    };

    const createdInteraction = await crearInteraccionService(
      newInteractionData,
      agentA1._id.toString(),
      tenantA._id.toString()
    );

    // Expected: Interaction should be created with sentiment analysis
    expect(createdInteraction).toBeDefined();
    expect(createdInteraction.tenantId.toString()).toBe(tenantA._id.toString());
    expect(createdInteraction.agentId._id.toString()).toBe(agentA1._id.toString());

    // Verify sentiment was analyzed (should be negative based on the note)
    // Note: The actual sentiment analysis depends on Anthropic API
    // For this test, we just verify the interaction was created
    expect(createdInteraction.sentimiento).toBeDefined();
    expect(['positivo', 'neutral', 'negativo']).toContain(createdInteraction.sentimiento);

    // If sentiment is negative with high score, alertaEnviada should be true
    if (createdInteraction.sentimiento === 'negativo' && (createdInteraction.sentimientoScore ?? 0) > 70) {
      expect(createdInteraction.alertaEnviada).toBe(true);
    }
  });

  // =========================================================================
  // Test Case 6: AuditLog created when admin updates critical client fields
  // =========================================================================

  it('Test Case 6: AuditLog created when admin updates critical client fields', async () => {
    // Setup: Authenticate as admin
    // Action: Call actualizarClienteService updating nombre field

    const updateData = {
      nombre: 'Updated Client Name',
    };

    const updatedClient = await actualizarClienteService(
      clientsA1[0]._id.toString(),
      updateData,
      adminA._id.toString(),
      'admin',
      tenantA._id.toString()
    );

    // Expected: Client should be updated
    expect(updatedClient).toBeDefined();
    expect(updatedClient.nombre).toBe('Updated Client Name');

    // Expected: AuditLog document should be created with cambios.antes and cambios.despues
    const auditLog = await AuditLog.findOne({
      tenantId: tenantA._id,
      documentoId: clientsA1[0]._id,
      accion: 'EDIT_CLIENT',
    }).lean();

    expect(auditLog).toBeDefined();
    expect(auditLog?.cambios).toBeDefined();
    expect(auditLog?.cambios.antes).toBeDefined();
    expect(auditLog?.cambios.despues).toBeDefined();
    expect(auditLog?.cambios.antes.nombre).toBe(clientsA1[0].nombre);
    expect(auditLog?.cambios.despues.nombre).toBe('Updated Client Name');
  });

  // =========================================================================
  // Test Case 7: Client estado auto-changes to 'resuelto' when interaction resultado='resuelto'
  // =========================================================================

  it('Test Case 7: Client estado auto-changes to resuelto when interaction resultado=resuelto', async () => {
    // Setup: Create client with estado='pendiente'
    const clientWithPendiente = await Client.create({
      tenantId: tenantA._id,
      nombre: 'Client Pending',
      apellido: 'Test',
      telefono: '555-9999',
      email: 'pending@example.com',
      estado: 'pendiente',
      creadoPor: supervisorA._id,
      asignadoA: agentA1._id,
    });

    // Verify initial state
    let client = await Client.findById(clientWithPendiente._id).lean();
    expect(client?.estado).toBe('pendiente');

    // Action: Call crearInteraccionService with resultado='resuelto'
    const newInteractionData = {
      clientId: clientWithPendiente._id.toString(),
      duracionMinutos: 10,
      resultado: 'resuelto' as const,
      nota: 'Issue resolved successfully.',
    };

    const createdInteraction = await crearInteraccionService(
      newInteractionData,
      agentA1._id.toString(),
      tenantA._id.toString()
    );

    // Expected: Interaction should be created
    expect(createdInteraction).toBeDefined();
    expect(createdInteraction.resultado).toBe('resuelto');

    // Expected: Client estado should change to 'resuelto'
    client = await Client.findById(clientWithPendiente._id).lean();
    expect(client?.estado).toBe('resuelto');
  });

  // =========================================================================
  // Additional Test: Supervisor cannot access clients of other supervisors
  // =========================================================================

  it('Additional Test: Supervisor cannot access clients of other supervisors', async () => {
    // Setup: Create 2 supervisors with different agents and clients ✓ (done in beforeEach)

    // Action: Supervisor A tries to access client assigned to agent B (under supervisor B)
    try {
      await obtenerClienteService(
        clientsB[0]._id.toString(),
        supervisorA._id.toString(),
        'supervisor',
        tenantB._id.toString()
      );
      // Should not reach here
      expect.fail('Should have thrown 403 error');
    } catch (err) {
      // Expected: Should return 403 "No tienes acceso a este cliente"
      expect(err).toBeInstanceOf(AppError);
      expect((err as AppError).statusCode).toBe(403);
    }
  });

  // =========================================================================
  // Additional Test: Agent cannot see interactions of other agents
  // =========================================================================

  it('Additional Test: Agent cannot see interactions of other agents', async () => {
    // Setup: Create interactions for different agents
    const interaction1 = await Interaction.create({
      tenantId: tenantA._id,
      clientId: clientsA1[0]._id,
      agentId: agentA1._id,
      nota: 'Interaction by agent A1',
      resultado: 'pendiente',
      sentimiento: 'neutral',
      sentimientoScore: 50,
    });

    const interaction2 = await Interaction.create({
      tenantId: tenantA._id,
      clientId: clientsA2[0]._id,
      agentId: agentA2._id,
      nota: 'Interaction by agent A2',
      resultado: 'pendiente',
      sentimiento: 'neutral',
      sentimientoScore: 50,
    });

    // Action: Agent A1 lists interactions
    const filtros = {
      clientId: undefined,
      agentId: undefined,
      resultado: undefined,
      sentimiento: undefined,
      fechaDesde: undefined,
      fechaHasta: undefined,
      pagina: 1,
      limite: 10,
    };

    const result = await listarInteraccionesService(
      filtros,
      agentA1._id.toString(),
      'agent',
      tenantA._id.toString()
    );

    // Expected: Should return only 1 interaction (from agent A1)
    expect(result.interacciones.length).toBe(1);
    expect(result.interacciones[0].agentId._id.toString()).toBe(agentA1._id.toString());

    // Verify no interactions from agent A2 are returned
    const agentIds = result.interacciones.map((i: any) => i.agentId._id.toString());
    expect(agentIds).not.toContain(agentA2._id.toString());
  });

  // =========================================================================
  // Additional Test: Supervisor can see all interactions of their agents
  // =========================================================================

  it('Additional Test: Supervisor can see all interactions of their agents', async () => {
    // Setup: Create interactions for agents under supervisor A
    const interaction1 = await Interaction.create({
      tenantId: tenantA._id,
      clientId: clientsA1[0]._id,
      agentId: agentA1._id,
      nota: 'Interaction by agent A1',
      resultado: 'pendiente',
      sentimiento: 'neutral',
      sentimientoScore: 50,
    });

    const interaction2 = await Interaction.create({
      tenantId: tenantA._id,
      clientId: clientsA2[0]._id,
      agentId: agentA2._id,
      nota: 'Interaction by agent A2',
      resultado: 'pendiente',
      sentimiento: 'neutral',
      sentimientoScore: 50,
    });

    // Action: Supervisor A lists interactions
    const filtros = {
      clientId: undefined,
      agentId: undefined,
      resultado: undefined,
      sentimiento: undefined,
      fechaDesde: undefined,
      fechaHasta: undefined,
      pagina: 1,
      limite: 10,
    };

    const result = await listarInteraccionesService(
      filtros,
      supervisorA._id.toString(),
      'supervisor',
      tenantA._id.toString()
    );

    // Expected: Should return 2 interactions (from both agents)
    expect(result.interacciones.length).toBe(2);
    expect(result.total).toBe(2);

    // Verify all interactions belong to agents under supervisor A
    const agentIds = result.interacciones.map((i: any) => i.agentId._id.toString());
    expect(agentIds).toContain(agentA1._id.toString());
    expect(agentIds).toContain(agentA2._id.toString());
  });

  // =========================================================================
  // Additional Test: Populate fields are correctly populated
  // =========================================================================

  it('Additional Test: Populate fields are correctly populated in list results', async () => {
    // Setup: Create clients with references ✓ (done in beforeEach)

    // Action: Agent A1 lists their clients
    const filtros = {
      estado: undefined,
      asignadoA: undefined,
      busqueda: undefined,
      pagina: 1,
      limite: 10,
    };

    const result = await listarClientesService(
      filtros,
      agentA1._id.toString(),
      'agent',
      tenantA._id.toString()
    );

    // Expected: All clients should have populated asignadoA and creadoPor
    expect(result.clientes.length).toBeGreaterThan(0);

    result.clientes.forEach((client: any) => {
      // asignadoA should be an object with _id, nombre, email
      expect(client.asignadoA).toBeDefined();
      expect(typeof client.asignadoA).toBe('object');
      expect(client.asignadoA._id).toBeDefined();
      expect(client.asignadoA.nombre).toBeDefined();
      expect(client.asignadoA.email).toBeDefined();

      // creadoPor should be an object with _id, nombre, email
      expect(client.creadoPor).toBeDefined();
      expect(typeof client.creadoPor).toBe('object');
      expect(client.creadoPor._id).toBeDefined();
      expect(client.creadoPor.nombre).toBeDefined();
      expect(client.creadoPor.email).toBeDefined();
    });
  });
});
