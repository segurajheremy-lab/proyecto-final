# CallCenter IA - Sistema SaaS Multi-Tenant

Plataforma completa de gestion de call centers con arquitectura multi-tenant. Backend REST API en Node.js/TypeScript y frontend React con landing page, autenticacion, dashboards por rol y control de asistencia en tiempo real.

---

## Estructura del Proyecto

- / - Backend Node.js + TypeScript (puerto 5000)
- landing/ - Frontend React + Vite + Tailwind (puerto 5173)

---

## Stack Tecnologico

### Backend

| Categoria | Tecnologia | Version |
|---|---|---|
| Runtime | Node.js | >= 20.0.0 |
| Lenguaje | TypeScript | 5.4.5 |
| Framework HTTP | Express.js | 4.19.2 |
| Base de datos | MongoDB Atlas + Mongoose | 8.4.1 |
| Autenticacion | jsonwebtoken | 9.0.2 |
| Hash contrasenas | bcryptjs | 2.4.3 |
| Validacion | Zod | 3.23.8 |
| Seguridad HTTP | Helmet | 7.1.0 |
| CORS | cors | 2.8.5 |
| Rate limiting | express-rate-limit | 7.3.1 |
| Variables de entorno | dotenv | 16.4.5 |
| Emails | Nodemailer | 6.9.13 |
| Excel | ExcelJS | 4.4.0 |
| Jobs programados | node-cron | 3.0.3 |
| Testing | Vitest + fast-check + Supertest | 1.6.0 |
| Dev server | Nodemon + ts-node | 3.1.3 / 10.9.2 |

### Frontend

| Categoria | Tecnologia | Version |
|---|---|---|
| Framework | React | 18.3.1 |
| Build tool | Vite | 5.3.1 |
| Lenguaje | TypeScript | 5.4.5 |
| Estilos | Tailwind CSS | 3.4.4 |
| Routing | React Router v6 | 6.24.0 |
| HTTP client | Axios | 1.7.2 |
| Iconos | Lucide React | 0.395.0 |

---

## Instalacion y Arranque

### Requisitos previos
- Node.js 20+, npm 9+, cuenta en MongoDB Atlas

### Backend
```bash
npm install
cp .env.example .env
npm run dev  # -> http://localhost:5000
```n
### Frontend
```bash
cd landing
npm install
npm run dev  # -> http://localhost:5173
```n
---

## Variables de Entorno

| Variable | Proposito | Ejemplo |
|---|---|---|
| PORT | Puerto del servidor | 5000 |
| NODE_ENV | Entorno de ejecucion | development |
| MONGODB_URI | URI de MongoDB Atlas | mongodb+srv://... |
| JWT_SECRET | Clave secreta JWT (min. 32 chars) | super-secret-key-32-chars |
| JWT_EXPIRES_IN | Expiracion del token | 8h |
| FRONTEND_URL | URL del frontend (links de invitacion) | http://localhost:5173 |
| MAIL_HOST | Host SMTP | smtp.gmail.com |
| MAIL_PORT | Puerto SMTP | 587 |
| MAIL_USER | Usuario SMTP | tu@gmail.com |
| MAIL_PASS | Contrasena SMTP | app-password |
| MAIL_FROM | Remitente de emails | no-reply@empresa.com |
| ANTHROPIC_API_KEY | API key de Anthropic (IA) | sk-ant-... |

---

## API REST - Endpoints

Base URL: http://localhost:5000/api/v1

### Health Check (publico)
| GET | /health | Estado del servidor |

### Autenticacion
| Metodo | Ruta | Descripcion |
|---|---|---|
| POST | /auth/registro | Registra nueva empresa + owner |
| POST | /auth/login | Autentica usuario, retorna JWT |
| POST | /auth/aceptar-invitacion | Acepta invitacion y crea cuenta |
| POST | /auth/invitar | Genera link de invitacion (protegido) |
| GET | /auth/me | Perfil del usuario autenticado (protegido) |

### Tenants (protegido)
| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | /tenants/mio | Datos del tenant del usuario |
| PATCH | /tenants/mio | Actualiza nombre, colores, agentesLimit (solo owner) |

### Usuarios (protegido)
| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | /users | Lista usuarios del tenant (filtrado por rol) |
| GET | /users/:id | Obtiene un usuario |
| PATCH | /users/:id | Actualiza horario, tolerancia, supervisorId |
| PATCH | /users/:id/desactivar | Desactiva usuario |
| PATCH | /users/:id/activar | Activa usuario |

### Asistencia (protegido)
| Metodo | Ruta | Descripcion |
|---|---|---|
| POST | /attendance/evento | Registra evento de jornada (inicio/refrigerio/fin) |
| GET | /attendance/hoy | Asistencia de hoy del usuario autenticado |
| GET | /attendance/historial?dias=30 | Historial personal de asistencia |
| GET | /attendance | Lista asistencia filtrada por rol |

### Interacciones (protegido)
| Metodo | Ruta | Descripcion |
|---|---|---|
| POST | /interactions | Crea interaccion agente-cliente |
| GET | /interactions | Lista interacciones filtradas por rol |

### Estadisticas (protegido)
| Metodo | Ruta | Descripcion |
|---|---|---|
| GET | /stats/resumen | Stats del dashboard segun rol del usuario |
| GET | /stats/dashboard | Asistencia semanal + sentimiento (owner/admin) |

---

## Estructura de Carpetas - Backend

```
src/
+-- app.ts                    # Express app: middlewares globales + rutas
+-- server.ts                 # Punto de entrada: env -> DB -> jobs -> listen
+-- config/
|   +-- env.ts                # Valida variables de entorno con Zod al arrancar
|   +-- db.ts                 # Conexion a MongoDB Atlas
|   +-- permissions.ts        # RBAC: 6 roles, 30 permisos, hasPermission(), canManageRole()
+-- models/
|   +-- Tenant.model.ts       # Empresa/organizacion (colores, plan, agentesLimit)
|   +-- User.model.ts         # Usuarios con roles y horario laboral
|   +-- Attendance.model.ts   # Registro de jornadas y eventos de asistencia
|   +-- Client.model.ts       # Clientes del call center
|   +-- Interaction.model.ts  # Interacciones agente-cliente con sentimiento IA
|   +-- AuditLog.model.ts     # Auditoria de acciones administrativas
+-- routes/
|   +-- index.ts              # Agregador /api/v1
|   +-- health.route.ts, auth.routes.ts, tenant.routes.ts
|   +-- users.routes.ts, attendance.routes.ts, interactions.routes.ts, stats.routes.ts
+-- controllers/
|   +-- auth.controller.ts, tenant.controller.ts, users.controller.ts
|   +-- attendance.controller.ts, interactions.controller.ts, stats.controller.ts
+-- services/
|   +-- auth.service.ts       # Logica de registro, login, invitaciones JWT
+-- middlewares/
|   +-- auth.middleware.ts         # authenticate(): JWT + horario laboral Peru
|   +-- permission.middleware.ts   # authorize(permission) + requireTenant()
|   +-- tenantScope.middleware.ts  # Expone req.tenantId
|   +-- validate.middleware.ts     # Factory validateBody<T>(schema)
|   +-- rateLimiter.ts             # 100 req/15min por IP
|   +-- errorHandler.middleware.ts # AppError + ZodError + MongoError
+-- validators/
|   +-- auth.validator.ts     # Schemas Zod: registro, login, invitacion
+-- utils/
|   +-- mail.util.ts          # sendMail() con Nodemailer
|   +-- excel.util.ts         # generateExcel() con ExcelJS
|   +-- time.util.ts          # Utilidades timezone Peru (UTC-5)
+-- jobs/
|   +-- index.ts              # initJobs(): cron jobs con logging y error handling
+-- types/
|   +-- express.d.ts          # req.user (AuthUser) + req.tenantId
+-- __tests__/
    +-- unit/                 # 7 archivos de tests unitarios
    +-- property/             # 5 archivos property-based tests (fast-check)
    +-- integration/          # Tests de integracion con Supertest
```

---

## Estructura de Carpetas - Frontend

```
landing/src/
+-- App.tsx                    # Router principal + AuthProvider + TenantProvider
+-- context/
|   +-- AuthContext.tsx         # Estado global de auth (token, user, login, logout)
|   +-- TenantContext.tsx       # Configuracion del tenant (colores, plan, refresh)
+-- lib/
|   +-- api.ts                 # Axios con interceptores JWT + todos los endpoints
+-- components/
|   +-- Navbar.tsx             # Navbar fija con login/registro, responsive
|   +-- HeroSection.tsx        # Carrusel 3 slides con overlay y CTA
|   +-- LeadGenSection.tsx     # Form de email -> abre RegistroModal
|   +-- RegistroModal.tsx      # Modal 2 pasos: empresa + owner -> POST /auth/registro
|   +-- QuienesSomosSection.tsx# Grid 2 cols con metricas y cards
|   +-- QueOfrecemosSection.tsx# 3 columnas con barra de color superior
|   +-- DashboardSection.tsx   # Panel simulado con grafico SVG de sentimiento
|   +-- ImpactBanner.tsx       # Banner azul oscuro con stat de impacto
|   +-- VideoDemoSection.tsx   # Mockup de browser con badges flotantes
|   +-- SocialProofSection.tsx # Logos ficticios en grayscale
|   +-- ContactSection.tsx     # Formulario Solicitar Demo con validacion
|   +-- Footer.tsx             # 4 columnas + badges SOC2/GDPR
|   +-- ProtectedRoute.tsx     # Guard que redirige a /login si no autenticado
+-- pages/
    +-- LandingPage.tsx        # Ensambla las 10 secciones del landing
    +-- LoginPage.tsx          # Login + manejo error OUTSIDE_WORK_HOURS
    +-- AceptarInvitacionPage.tsx # Acepta token de invitacion, crea cuenta
    +-- dashboard/
        +-- DashboardLayout.tsx    # Shell: sidebar dinamico por rol + topbar
        +-- ResumenPage.tsx        # Dashboard diferenciado por rol (datos reales)
        +-- EquipoPage.tsx         # Invitar usuarios con selector de rol
        +-- EmpresaPage.tsx        # Configurar empresa (datos reales desde BD)
        +-- ConfiguracionPage.tsx  # Notificaciones, seguridad, tolerancia
        +-- roles/
            +-- AdminPage.tsx      # KPIs, tabla usuarios, asistencia semanal, alertas
            +-- SubAdminPage.tsx   # Tabs: supervisores / agentes / reportes
            +-- SupervisorPage.tsx # Tabs: agentes (sentimiento) / clientes / alertas
            +-- AgentePage.tsx     # Jornada real (BD) + historial de asistencia
```

---

## Modelos de Datos

### Tenant
- nombre, dominio (unico), slug (unico), logo
- colores: { primario: '#3B82F6', secundario: '#1E293B' }
- plan: trial | starter | pro | enterprise
- status: active | suspended | trial
- trialExpira: Date (+14 dias desde creacion)
- agentesLimit: number (default 10)

### User
- tenantId, nombre, email (unico por tenant), passwordHash (bcrypt 12)
- role: super_admin | owner | admin | sub_admin | supervisor | agent
- horario: { entrada, salidaRefrigerio, vueltaRefrigerio, salida } (formato HH:MM)
- toleranciaMinutos: number (default 10)
- supervisorId, subAdminId, activo, ultimoLogin
- Indice unico: { tenantId, email }

### Attendance
- tenantId, userId, fecha (YYYY-MM-DD en hora Peru)
- status: sin_jornada | jornada_activa | en_refrigerio | post_refrigerio | finalizado | falta | falta_justificada
- eventos: [{ tipo, timestamp, metodo }]
- tardanza, minutosTardanza, minutosRefrigerio, horasTrabajadas
- Indice unico: { tenantId, userId, fecha }

### Client
- tenantId, nombre, apellido, telefono, email, direccion, empresa
- estado: activo | pendiente | resuelto | inactivo
- creadoPor, asignadoA, supervisorId, etiquetas, notas, ultimaInteraccion

### Interaction
- tenantId, clientId, agentId, fecha, duracionMinutos
- resultado: resuelto | pendiente | sin_respuesta | callback
- nota (texto analizado por IA), sentimiento, sentimientoScore (0-100)
- alertaEnviada

### AuditLog
- tenantId, adminId, accion, coleccion, documentoId
- cambios: { antes, despues }, razon, creadoEn

---

## Sistema de Roles y Permisos

Jerarquia estricta - un rol solo puede gestionar roles por debajo del suyo:

```
super_admin  ->  Gestiona toda la plataforma
    owner       ->  Dueno de empresa, crea Admins
        admin       ->  Gerente, gestiona todo el personal
            sub_admin   ->  Lider de area
                supervisor  ->  Supervisa agentes, gestiona clientes
                    agent       ->  Marca asistencia, registra interacciones
```n
30 permisos en 7 categorias:
- Gestion de Tenants (4): VIEW_ALL_TENANTS, MANAGE_TENANT, VIEW_OWN_TENANT, CONFIGURE_TENANT
- Gestion de Usuarios (8): CREATE_ADMIN, CREATE_SUB_ADMIN, CREATE_SUPERVISOR, CREATE_AGENT, EDIT_USER, DEACTIVATE_USER, VIEW_ALL_USERS, VIEW_TEAM_USERS
- Asistencia (5): MARK_ATTENDANCE, VIEW_OWN_ATTENDANCE, VIEW_TEAM_ATTENDANCE, VIEW_ALL_ATTENDANCE, EDIT_ATTENDANCE
- Clientes (7): CREATE_CLIENT, ASSIGN_CLIENT, VIEW_ASSIGNED_CLIENTS, VIEW_TEAM_CLIENTS, VIEW_ALL_CLIENTS, EDIT_CLIENT, DELETE_CLIENT
- Interacciones (4): CREATE_INTERACTION, VIEW_OWN_INTERACTIONS, VIEW_TEAM_INTERACTIONS, VIEW_ALL_INTERACTIONS
- Reportes (4): GENERATE_TEAM_REPORT, GENERATE_AREA_REPORT, GENERATE_FULL_REPORT, SEND_REPORT
- IA y Alertas (2): VIEW_SENTIMENT_ALERTS, MANAGE_AI_CONFIG

---

## Seguridad

| Capa | Implementacion | Detalle |
|---|---|---|
| Cabeceras HTTP | Helmet 7.1.0 | CSP, X-Frame-Options, HSTS |
| CORS | cors 2.8.5 | Configurable por CORS_ORIGIN |
| Rate limiting | express-rate-limit | 100 req / 15 min por IP -> HTTP 429 |
| Validacion de entrada | Zod | Todos los endpoints validan el body |
| Autenticacion | JWT Bearer | Verifica firma + carga user desde DB |
| Autorizacion | RBAC | 30 permisos, jerarquia de 6 roles |
| Aislamiento de datos | tenantId en todos los queries | Empresa A no ve datos de Empresa B |
| Contrasenas | bcrypt rounds 12 | Nunca en texto plano |
| Control de horario | Peru UTC-5 | Agentes bloqueados fuera de jornada |
| Validacion de env | Zod al arrancar | El servidor no inicia si falta una variable |

---

## Control de Jornada (Peru UTC-5)

1. Al hacer login: verifica que la hora actual (Peru) este dentro del horario configurado.
2. Fuera de horario: responde 403 con code OUTSIDE_WORK_HOURS y mensaje descriptivo.
3. Tolerancia: configurable por usuario (toleranciaMinutos, default 10 min).
4. Tardanza: si el agente inicia despues de entrada + tolerancia, se marca tardanza: true.
5. El estado de jornada persiste en MongoDB aunque se recargue la pagina.

---

## Personalizacion Multi-Tenant (Colores)

Cada empresa tiene sus propios colores almacenados en MongoDB:
- El owner los configura desde Mi Empresa -> PATCH /tenants/mio
- Al autenticarse, TenantContext carga los colores y aplica CSS variables globales
- Los cambios de una empresa no afectan a las demas

---

## Flujos Principales

### Registro de Empresa
```
Landing -> Comenzar gratis -> Modal 2 pasos
  Paso 1: Nombre empresa + dominio + slug (auto-generado)
  Paso 2: Nombre owner + email (@dominio) + contrasena
  -> POST /api/v1/auth/registro -> JWT -> /dashboard
```n
### Invitacion de Usuario
```
Owner/Admin -> Equipo -> Selecciona rol -> Ingresa email
  -> POST /api/v1/auth/invitar
  -> JWT de invitacion (48h) -> link http://localhost:5173/aceptar-invitacion?token=...
  -> Invitado abre link -> crea contrasena -> POST /auth/aceptar-invitacion -> /dashboard
```n
### Asistencia del Agente
```
Login -> Backend verifica horario Peru UTC-5
  Fuera de horario -> 403 OUTSIDE_WORK_HOURS -> Frontend muestra bloqueo
  En horario -> Mi Panel -> GET /attendance/hoy -> estado desde MongoDB
  Iniciar jornada -> POST /attendance/evento { tipo: inicio }
  Refrigerio -> POST /attendance/evento { tipo: salida_refrigerio }
  Volver -> POST /attendance/evento { tipo: vuelta_refrigerio }
  Finalizar -> POST /attendance/evento { tipo: fin } -> calcula horas trabajadas
  Historial -> GET /attendance/historial?dias=30
```n
---

## Scripts

### Backend
```
bash
npm run dev          # Desarrollo con hot-reload (nodemon + ts-node)
npm run build        # Compila TypeScript -> dist/
npm start            # Ejecuta el build compilado
npm test             # Todos los tests una vez
npm run test:watch   # Tests en modo watch
npm run test:coverage # Tests con reporte de cobertura
```n
### Frontend
```
bash
cd landing
npm run dev      # Desarrollo -> http://localhost:5173
npm run build    # Build de produccion
npm run preview  # Preview del build
```n
---

## Tests

### Unit Tests (7 archivos)
env.test.ts, db.test.ts, auth.middleware.test.ts, validate.middleware.test.ts, mail.util.test.ts, excel.util.test.ts, jobs.test.ts

### Property-Based Tests (5 archivos, fast-check, 100+ iteraciones cada uno)
env.property.test.ts (Props 1-2), validate.property.test.ts (Props 3-4), auth.property.test.ts (Props 5-6), excel.property.test.ts (Prop 7), rateLimiter.property.test.ts (Prop 8)

### Integration Tests
health.test.ts - GET /health con Supertest

---

## Colecciones en MongoDB Atlas

| Coleccion | Descripcion |
|---|---|
| tenants | Empresas registradas en la plataforma |
| users | Usuarios con roles, horarios y referencias |
| attendances | Registros de jornada laboral por dia |
| clients | Clientes del call center |
| interactions | Interacciones agente-cliente con sentimiento IA |
| auditlogs | Registro inmutable de acciones administrativas |

---

## Verificacion rapida

```
bash
# Health check
curl http://localhost:5000/health

# Registro de empresa
curl -X POST http://localhost:5000/api/v1/auth/registro -H 'Content-Type: application/json' -d '{
  "nombreEmpresa": "Mi Empresa",
  "dominio": "miempresa.com",
  "slug": "mi-empresa",
  "nombreOwner": "Juan Perez",
  "email": "juan@miempresa.com",
  "password": "password123"
}'
```
