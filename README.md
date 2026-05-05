# Sistema Backend Base — Node.js / TypeScript

Backend REST API de producción para plataformas SaaS multi-tenant. Construido sobre Node.js 20+, TypeScript y Express.js con autenticación JWT, base de datos MongoDB Atlas, validación estricta de datos, seguridad HTTP en capas y soporte para emails, Excel y jobs programados.

---

## Stack Tecnológico

| Categoría | Tecnología | Versión |
|---|---|---|
| Runtime | Node.js | ≥ 20.0.0 |
| Lenguaje | TypeScript | 5.4.5 |
| Framework HTTP | Express.js | 4.19.2 |
| Base de datos | MongoDB Atlas + Mongoose | 8.4.1 |
| Autenticación | jsonwebtoken | 9.0.2 |
| Hash de contraseñas | bcryptjs | 2.4.3 |
| Validación de datos | Zod | 3.23.8 |
| Seguridad HTTP | Helmet | 7.1.0 |
| CORS | cors | 2.8.5 |
| Rate limiting | express-rate-limit | 7.3.1 |
| Variables de entorno | dotenv | 16.4.5 |
| Emails | Nodemailer | 6.9.13 |
| Excel | ExcelJS | 4.4.0 |
| Jobs programados | node-cron | 3.0.3 |
| Testing | Vitest + fast-check + Supertest | 1.6.0 |
| Dev server | Nodemon + ts-node | 3.1.3 / 10.9.2 |

---

## Estructura de Carpetas

```
src/
├── app.ts                  # Configuración de Express: middlewares globales y registro de rutas
├── server.ts               # Punto de entrada: valida env → conecta DB → inicia jobs → escucha
│
├── config/
│   ├── env.ts              # Valida variables de entorno con Zod al arrancar (falla rápido)
│   ├── db.ts               # Conexión a MongoDB Atlas con Mongoose
│   └── permissions.ts      # Sistema RBAC: roles, permisos, hasPermission(), canManageRole()
│
├── models/                 # Schemas de Mongoose + interfaces TypeScript
│   ├── Tenant.model.ts     # Empresa/organización (multi-tenant)
│   ├── User.model.ts       # Usuarios con roles jerárquicos
│   ├── Attendance.model.ts # Registro de asistencia y jornadas
│   ├── Client.model.ts     # Clientes del call center
│   ├── Interaction.model.ts# Interacciones agente-cliente con análisis de sentimiento
│   └── AuditLog.model.ts   # Auditoría de acciones administrativas
│
├── routes/
│   ├── index.ts            # Agregador del API router (/api/v1)
│   ├── health.route.ts     # GET /health — sin autenticación
│   └── auth.routes.ts      # Rutas de autenticación (/api/v1/auth/*)
│
├── controllers/
│   └── auth.controller.ts  # Handlers HTTP: validan con Zod, delegan al servicio
│
├── services/
│   └── auth.service.ts     # Lógica de negocio: registro, login, invitaciones
│
├── middlewares/
│   ├── auth.middleware.ts       # authenticate(): verifica JWT + carga user desde DB
│   ├── permission.middleware.ts # authorize(permission) + requireTenant()
│   ├── tenantScope.middleware.ts# Expone req.tenantId como shortcut seguro
│   ├── validate.middleware.ts   # Factory validateBody<T>(schema) para validación Zod
│   ├── rateLimiter.ts           # Rate limiting global: 100 req / 15 min por IP
│   └── errorHandler.middleware.ts # AppError + manejo centralizado de errores
│
├── validators/
│   └── auth.validator.ts   # Schemas Zod para registro, login e invitaciones
│
├── utils/
│   ├── mail.util.ts        # sendMail(): envío de emails transaccionales con Nodemailer
│   └── excel.util.ts       # generateExcel(): genera archivos .xlsx con ExcelJS
│
├── jobs/
│   └── index.ts            # initJobs(): registra y ejecuta tareas programadas con node-cron
│
├── types/
│   └── express.d.ts        # Extensión de Request: req.user (AuthUser) y req.tenantId
│
└── __tests__/
    ├── unit/               # Tests unitarios por módulo
    ├── property/           # Property-based tests con fast-check (8 propiedades)
    └── integration/        # Tests de integración con Supertest
```

---

## Configuración del Entorno

Copia `.env.example` a `.env` y completa los valores:

```bash
cp .env.example .env
```

| Variable | Propósito | Ejemplo |
|---|---|---|
| `PORT` | Puerto en el que escucha el servidor | `3000` |
| `NODE_ENV` | Entorno de ejecución (`development`, `production`, `test`) | `development` |
| `MONGODB_URI` | URI de conexión a MongoDB Atlas | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `JWT_SECRET` | Clave secreta para firmar tokens JWT (mínimo 32 caracteres) | `super-secret-key-32-chars-minimum` |
| `JWT_EXPIRES_IN` | Tiempo de expiración de los tokens de sesión | `8h` |
| `MAIL_HOST` | Host del servidor SMTP | `smtp.gmail.com` |
| `MAIL_PORT` | Puerto SMTP (587 para TLS, 465 para SSL) | `587` |
| `MAIL_USER` | Usuario de autenticación SMTP | `tu@empresa.com` |
| `MAIL_PASS` | Contraseña o App Password del SMTP | `app-password` |
| `MAIL_FROM` | Dirección remitente en los emails enviados | `no-reply@empresa.com` |
| `ANTHROPIC_API_KEY` | API key de Anthropic para funciones de IA | `sk-ant-...` |

> El servidor **no arranca** si alguna variable está ausente o tiene un formato inválido. El error indica exactamente qué variable falta.

---

## Seguridad

El sistema implementa seguridad en capas. Cada capa actúa de forma independiente:

### 1. Helmet — Cabeceras HTTP seguras
Aplica automáticamente cabeceras como `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options` y otras en todas las respuestas. Mitiga ataques XSS, clickjacking y sniffing de contenido.

### 2. CORS — Control de origen cruzado
Configurable vía `CORS_ORIGIN`. Por defecto permite todos los orígenes en desarrollo. En producción se debe restringir a los dominios del frontend.

### 3. Rate Limiting — Límite de peticiones
`express-rate-limit` limita a **100 peticiones por IP cada 15 minutos** de forma global. Las peticiones que superan el límite reciben HTTP `429` con un mensaje descriptivo.

### 4. Validación con Zod — Sanitización de entrada
Todos los endpoints validan el cuerpo de la petición contra un schema Zod antes de llegar al controlador. Payloads inválidos reciben HTTP `400` con un array de errores por campo. Los datos validados reemplazan `req.body` con el tipo correcto.

### 5. Autenticación JWT — Identidad verificada
El middleware `authenticate()` verifica el token Bearer, carga el usuario desde MongoDB (sin `passwordHash`) y verifica que tanto el usuario como su tenant estén activos. Cualquier fallo retorna HTTP `401`.

### 6. Autorización RBAC — Control de acceso por rol
`authorize(permission)` verifica que el rol del usuario tenga el permiso requerido antes de ejecutar el handler. Los roles siguen una jerarquía estricta: `super_admin > owner > admin > sub_admin > supervisor > agent`.

### 7. Tenant Scope — Aislamiento de datos
`tenantScope()` expone `req.tenantId` como shortcut de `req.user.tenantId`. Garantiza que los controladores y servicios operen siempre dentro del tenant correcto sin acceso accidental a datos de otras empresas.

### 8. Contraseñas — bcrypt rounds 12
Las contraseñas nunca se almacenan en texto plano. Se hashean con bcrypt usando 12 rondas de salt. El campo `passwordHash` se excluye de todas las consultas con `.select('-passwordHash')`.

---

## Endpoints Base

### Health Check

```
GET /health
```

No requiere autenticación. Usado por load balancers y herramientas de monitoreo.

**Respuesta exitosa `200 OK`:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "uptime": 3600.5
}
```

### Autenticación

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| `POST` | `/api/v1/auth/registro` | Pública | Registra una nueva empresa y su usuario owner |
| `POST` | `/api/v1/auth/login` | Pública | Autentica un usuario y retorna token JWT |
| `POST` | `/api/v1/auth/aceptar-invitacion` | Pública | Acepta una invitación y crea la cuenta |
| `POST` | `/api/v1/auth/invitar` | `authenticate` | Genera un link de invitación para un nuevo usuario |
| `GET`  | `/api/v1/auth/me` | `authenticate` | Retorna el perfil del usuario autenticado |

---

## Scripts del Proyecto

```bash
# Desarrollo con hot-reload (nodemon + ts-node)
npm run dev

# Compilar TypeScript a JavaScript en dist/
npm run build

# Ejecutar el servidor compilado (producción)
npm start

# Ejecutar todos los tests una vez
npm test

# Tests en modo watch (desarrollo)
npm run test:watch

# Tests con reporte de cobertura
npm run test:coverage
```

---

## Instalación

### Requisitos previos

- Node.js 20 o superior
- npm 9 o superior
- Una base de datos en [MongoDB Atlas](https://www.mongodb.com/atlas)

### Pasos

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd nodejs-express-backend

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con los valores reales

# 4. Levantar el servidor en desarrollo
npm run dev
```

El servidor estará disponible en `http://localhost:3000` (o el puerto configurado en `PORT`).

Para verificar que todo funciona:

```bash
curl http://localhost:3000/health
# → { "status": "ok", "timestamp": "...", "uptime": ... }
```

### Build de producción

```bash
npm run build
npm start
```

---

## Modelos de Datos

| Modelo | Colección | Descripción |
|---|---|---|
| `Tenant` | `tenants` | Empresa/organización. Contiene plan, dominio, slug y configuración visual |
| `User` | `users` | Usuario con rol jerárquico. Índice único `{ tenantId, email }` |
| `Attendance` | `attendances` | Registro de jornada laboral con eventos y cálculo de tardanza |
| `Client` | `clients` | Cliente del call center asignado a un agente |
| `Interaction` | `interactions` | Interacción agente-cliente con análisis de sentimiento por IA |
| `AuditLog` | `auditlogs` | Registro inmutable de acciones administrativas |

---

## Sistema de Roles y Permisos

Los roles siguen una jerarquía estricta. Un rol solo puede gestionar roles por debajo del suyo:

```
super_admin  →  Ve y gestiona todas las empresas de la plataforma
    └── owner       →  Dueño de una empresa, crea al admin principal
        └── admin       →  Gerente, gestiona todo el personal
            └── sub_admin   →  Líder de área, gestiona supervisores y agentes
                └── supervisor  →  Supervisa agentes, gestiona clientes
                    └── agent       →  Marca asistencia, registra interacciones
```

Los permisos están centralizados en `src/config/permissions.ts`. Para verificar un permiso en código:

```typescript
import { hasPermission, canManageRole } from './config/permissions';

hasPermission('supervisor', 'VIEW_TEAM_CLIENTS') // true
hasPermission('agent', 'DELETE_CLIENT')          // false
canManageRole('admin', 'supervisor')             // true
canManageRole('agent', 'supervisor')             // false
```
