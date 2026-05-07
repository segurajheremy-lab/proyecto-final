import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Types } from 'mongoose';
import { connectDB } from '../../config/db';
import { Client } from '../../models/Client.model';
import { Interaction } from '../../models/Interaction.model';
import { User } from '../../models/User.model';
import { Tenant } from '../../models/Tenant.model';
import { listarClientesService } from '../../services/client.service';
import { listarInteraccionesService } from '../../services/interaction.service';
import { crearClienteService } from '../../services/client.service';
import { crearInteraccionService } from '../../services/interaction.service';

/**
 * Bug Condition Exploration Tests
 *
 * These tests expose the bug in unfixed code by verifying that:
 * 1. GET /api/v1/clients returns clients filtered by tenantId
 * 2. GET /api/v1/interactions?sentimiento=negativo returns interactions filtered by tenantId
 * 3. POST /api/v1/clients assigns tenantId to created client
 * 4. POST /api/v1/interactions assigns tenantId to created interaction
 * 5. Populate fields return objects, not ObjectId strings
 *
 * CRITICAL: These tests MUST FAIL on unfixed code - failure confirms the bug exists.
 * DO NOT attempt to fix the test or the code when it fails.
 * Document the counterexamples found to understand the root cause.
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 1.11, 1.12
 */

describe('Bug Condition Exploration - MongoDB tenantId Filter', () => {
  let tenantA: any;
  let tenantB: any;
  let supervisorA: any;
  let supervisorB: any;
  let agentA: any;
  let agentB: any;
  let clientsA: any[] = [];
  let clientsB: any[] = [];
  let interactionsA: any[] = [];
  let interactionsB: any[] = [];

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
  });

  beforeEach(async () => {
    // Clean up before each test
    await Tenant.deleteMany({});
    await User.deleteMany({});
    await Client.deleteMany({});
    await Interaction.deleteMany({});

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

    // Create agents for each tenant
    agentA = await User.create({
      tenantId: tenantA._id,
      nombre: 'Agent A',
      email: 'agent-a@tenant-a.com',
      passwordHash: 'hashed-password',
      role: 'agent',
      supervisorId: supervisorA._id,
      activo: true,
    });

    agentB = await User.create({
      tenantId: tenantB._id,
      nombre: 'Agent B',
      email: 'agent-b@tenant-b.com',
      passwordHash: 'hashed-password',
      role: 'agent',
      supervisorId: supervisorB._id,
      activo: true,
    });

    // Create 5 clients for tenant A
    clientsA = [];
    for (let i = 1; i <= 5; i++) {
      const client = await Client.create({
        tenantId: tenantA._id,
        nombre: `Client A${i}`,
        apellido: `Lastname A${i}`,
        telefono: `555-000${i}`,
        email: `client-a${i}@example.com`,
        estado: 'activo',
        creadoPor: supervisorA._id,
        asignadoA: agentA._id,
      });
      clientsA.push(client);
    }

    // Create 5 clients for tenant B
    clientsB = [];
    for (let i = 1; i <= 5; i++) {
      const client = await Client.create({
        tenantId: tenantB._id,
        nombre: `Client B${i}`,
        apellido: `Lastname B${i}`,
        telefono: `666-000${i}`,
        email: `client-b${i}@example.com`,
        estado: 'activo',
        creadoPor: supervisorB._id,
        asignadoA: agentB._id,
      });
      clientsB.push(client);
    }

    // Create 3 negative interactions for tenant A
    interactionsA = [];
    for (let i = 1; i <= 3; i++) {
      const interaction = await Interaction.create({
        tenantId: tenantA._id,
        clientId: clientsA[i - 1]._id,
        agentId: agentA._id,
        nota: `Negative interaction A${i} - customer was upset`,
        resultado: 'pendiente',
        sentimiento: 'negativo',
        sentimientoScore: 75 + i * 5,
      });
      interactionsA.push(interaction);
    }

    // Create 3 negative interactions for tenant B
    interactionsB = [];
    for (let i = 1; i <= 3; i++) {
      const interaction = await Interaction.create({
        tenantId: tenantB._id,
        clientId: clientsB[i - 1]._id,
        agentId: agentB._id,
        nota: `Negative interaction B${i} - customer was upset`,
        resultado: 'pendiente',
        sentimiento: 'negativo',
        sentimientoScore: 75 + i * 5,
      });
      interactionsB.push(interaction);
    }
  });

  // =========================================================================
  // Test Case 1: GET /api/v1/clients returns clients filtered by tenantId
  // =========================================================================

  it('Test Case 1: GET /api/v1/clients without tenantId filter returns empty array when it should return clients', async () => {
    // Setup: Create 2 tenants with 5 clients each in MongoDB ✓ (done in beforeEach)

    // Action: Authenticate as user from tenant A, call listarClientesService
    const filtros = {
      estado: undefined,
      asignadoA: undefined,
      busqueda: undefined,
      pagina: 1,
      limite: 10,
    };

    const result = await listarClientesService(
      filtros,
      agentA._id.toString(),
      'agent',
      tenantA._id.toString()
    );

    // Expected: Should return 5 clients from tenant A only
    // Actual (unfixed): Returns empty array or returns clients from all tenants
    expect(result.clientes).toBeDefined();
    expect(result.clientes.length).toBe(5);
    expect(result.total).toBe(5);

    // Verify all returned clients belong to tenant A
    result.clientes.forEach((client: any) => {
      expect(client.tenantId.toString()).toBe(tenantA._id.toString());
      expect(client.nombre).toMatch(/^Client A/);
    });

    // Verify no clients from tenant B are returned
    const clientBNames = result.clientes.map((c: any) => c.nombre);
    expect(clientBNames.some((name: string) => name.startsWith('Client B'))).toBe(false);
  });

  // =========================================================================
  // Test Case 2: GET /api/v1/interactions?sentimiento=negativo filters by tenantId
  // =========================================================================

  it('Test Case 2: GET /api/v1/interactions?sentimiento=negativo without tenantId filter', async () => {
    // Setup: Create 2 tenants with 3 negative interactions each ✓ (done in beforeEach)

    // Action: Authenticate as user from tenant A, call listarInteraccionesService
    const filtros = {
      clientId: undefined,
      agentId: undefined,
      resultado: undefined,
      sentimiento: 'negativo',
      fechaDesde: undefined,
      fechaHasta: undefined,
      pagina: 1,
      limite: 10,
    };

    const result = await listarInteraccionesService(
      filtros,
      agentA._id.toString(),
      'agent',
      tenantA._id.toString()
    );

    // Expected: Should return 3 interactions from tenant A only
    // Actual (unfixed): Returns empty array or returns interactions from all tenants
    expect(result.interacciones).toBeDefined();
    expect(result.interacciones.length).toBe(3);
    expect(result.total).toBe(3);

    // Verify all returned interactions belong to tenant A
    result.interacciones.forEach((interaction: any) => {
      expect(interaction.tenantId.toString()).toBe(tenantA._id.toString());
      expect(interaction.sentimiento).toBe('negativo');
    });

    // Verify no interactions from tenant B are returned
    const interactionBNotes = result.interacciones.map((i: any) => i.nota);
    expect(interactionBNotes.some((note: string) => note.includes('B'))).toBe(false);
  });

  // =========================================================================
  // Test Case 3: POST /api/v1/clients assigns tenantId
  // =========================================================================

  it('Test Case 3: POST /api/v1/clients assigns tenantId to created client', async () => {
    // Setup: Authenticate as supervisor from tenant A ✓ (done in beforeEach)

    // Action: Call crearClienteService with valid client data
    const newClientData = {
      nombre: 'New Client',
      apellido: 'Test',
      telefono: '555-9999',
      email: 'new-client@example.com',
      estado: 'pendiente' as const,
      asignadoA: agentA._id.toString(),
    };

    const createdClient = await crearClienteService(
      newClientData,
      supervisorA._id.toString(),
      tenantA._id.toString()
    );

    // Expected: Created client should have tenantId = tenant A's ID
    // Actual (unfixed): Created client has no tenantId or wrong tenantId
    expect(createdClient).toBeDefined();
    expect(createdClient.tenantId).toBeDefined();
    expect(createdClient.tenantId.toString()).toBe(tenantA._id.toString());
    expect(createdClient.nombre).toBe('New Client');
    expect(createdClient.creadoPor).toBeDefined();
  });

  // =========================================================================
  // Test Case 4: POST /api/v1/interactions assigns tenantId
  // =========================================================================

  it('Test Case 4: POST /api/v1/interactions assigns tenantId to created interaction', async () => {
    // Setup: Authenticate as agent from tenant A ✓ (done in beforeEach)

    // Action: Call crearInteraccionService with valid interaction data
    const newInteractionData = {
      clientId: clientsA[0]._id.toString(),
      duracionMinutos: 5,
      resultado: 'resuelto' as const,
      nota: 'Test interaction note',
    };

    const createdInteraction = await crearInteraccionService(
      newInteractionData,
      agentA._id.toString(),
      tenantA._id.toString()
    );

    // Expected: Created interaction should have tenantId = tenant A's ID
    // Actual (unfixed): Created interaction has no tenantId or wrong tenantId
    expect(createdInteraction).toBeDefined();
    expect(createdInteraction.tenantId).toBeDefined();
    expect(createdInteraction.tenantId.toString()).toBe(tenantA._id.toString());
    expect(createdInteraction.agentId).toBeDefined();
    expect(createdInteraction.clientId).toBeDefined();
  });

  // =========================================================================
  // Test Case 5: Populate fields return objects, not ObjectId strings
  // =========================================================================

  it('Test Case 5: Populate fields return objects instead of ObjectId strings', async () => {
    // Setup: Create client with asignadoA reference ✓ (done in beforeEach)

    // Action: Call listarClientesService to get client with populated fields
    const filtros = {
      estado: undefined,
      asignadoA: undefined,
      busqueda: undefined,
      pagina: 1,
      limite: 10,
    };

    const result = await listarClientesService(
      filtros,
      agentA._id.toString(),
      'agent',
      tenantA._id.toString()
    );

    // Expected: Response should have asignadoA as object with { _id, nombre, email, role }
    // Actual (unfixed): Response has asignadoA as ObjectId string
    expect(result.clientes.length).toBeGreaterThan(0);

    const client = result.clientes[0];
    expect(client.asignadoA).toBeDefined();

    // Check that asignadoA is an object, not a string
    if (client.asignadoA) {
      expect(typeof client.asignadoA).toBe('object');
      expect(client.asignadoA._id).toBeDefined();
      expect(client.asignadoA.nombre).toBeDefined();
      expect(client.asignadoA.email).toBeDefined();
      expect(typeof client.asignadoA._id).not.toBe('string');
    }

    // Check that creadoPor is also populated
    expect(client.creadoPor).toBeDefined();
    if (client.creadoPor) {
      expect(typeof client.creadoPor).toBe('object');
      expect(client.creadoPor._id).toBeDefined();
      expect(client.creadoPor.nombre).toBeDefined();
    }
  });

  // =========================================================================
  // Additional Test: Supervisor can see all clients of their agents
  // =========================================================================

  it('Supervisor can see all clients of their agents (role-based filtering)', async () => {
    // Setup: Create supervisor with 2 agents, each with 3 clients
    const supervisor = await User.create({
      tenantId: tenantA._id,
      nombre: 'Supervisor Multi',
      email: 'supervisor-multi@tenant-a.com',
      passwordHash: 'hashed-password',
      role: 'supervisor',
      activo: true,
    });

    const agent1 = await User.create({
      tenantId: tenantA._id,
      nombre: 'Agent 1',
      email: 'agent-1@tenant-a.com',
      passwordHash: 'hashed-password',
      role: 'agent',
      supervisorId: supervisor._id,
      activo: true,
    });

    const agent2 = await User.create({
      tenantId: tenantA._id,
      nombre: 'Agent 2',
      email: 'agent-2@tenant-a.com',
      passwordHash: 'hashed-password',
      role: 'agent',
      supervisorId: supervisor._id,
      activo: true,
    });

    // Create 3 clients for agent1
    for (let i = 1; i <= 3; i++) {
      await Client.create({
        tenantId: tenantA._id,
        nombre: `Client Agent1-${i}`,
        apellido: `Lastname`,
        telefono: `777-000${i}`,
        email: `client-a1-${i}@example.com`,
        estado: 'activo',
        creadoPor: supervisor._id,
        asignadoA: agent1._id,
      });
    }

    // Create 3 clients for agent2
    for (let i = 1; i <= 3; i++) {
      await Client.create({
        tenantId: tenantA._id,
        nombre: `Client Agent2-${i}`,
        apellido: `Lastname`,
        telefono: `888-000${i}`,
        email: `client-a2-${i}@example.com`,
        estado: 'activo',
        creadoPor: supervisor._id,
        asignadoA: agent2._id,
      });
    }

    // Action: Supervisor lists clients
    const filtros = {
      estado: undefined,
      asignadoA: undefined,
      busqueda: undefined,
      pagina: 1,
      limite: 20,
    };

    const result = await listarClientesService(
      filtros,
      supervisor._id.toString(),
      'supervisor',
      tenantA._id.toString()
    );

    // Expected: Should return 6 clients (3 from each agent)
    expect(result.clientes.length).toBe(6);
    expect(result.total).toBe(6);

    // Verify all clients belong to tenant A
    result.clientes.forEach((client: any) => {
      expect(client.tenantId.toString()).toBe(tenantA._id.toString());
    });
  });

  // =========================================================================
  // Additional Test: Multi-tenant isolation
  // =========================================================================

  it('Multi-tenant isolation - Tenant A user cannot see Tenant B data', async () => {
    // Action: Agent from tenant A lists clients
    const filtros = {
      estado: undefined,
      asignadoA: undefined,
      busqueda: undefined,
      pagina: 1,
      limite: 20,
    };

    const resultA = await listarClientesService(
      filtros,
      agentA._id.toString(),
      'agent',
      tenantA._id.toString()
    );

    // Action: Agent from tenant B lists clients
    const resultB = await listarInteraccionesService(
      {
        clientId: undefined,
        agentId: undefined,
        resultado: undefined,
        sentimiento: undefined,
        fechaDesde: undefined,
        fechaHasta: undefined,
        pagina: 1,
        limite: 20,
      },
      agentB._id.toString(),
      'agent',
      tenantB._id.toString()
    );

    // Expected: Each tenant only sees their own data
    expect(resultA.clientes.length).toBe(5);
    expect(resultB.interacciones.length).toBe(3);

    // Verify no cross-tenant data leakage
    resultA.clientes.forEach((client: any) => {
      expect(client.tenantId.toString()).toBe(tenantA._id.toString());
    });

    resultB.interacciones.forEach((interaction: any) => {
      expect(interaction.tenantId.toString()).toBe(tenantB._id.toString());
    });
  });
});
