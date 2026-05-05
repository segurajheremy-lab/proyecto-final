# Implementation Plan: Node.js Express Backend

## Overview

Implementación incremental de un backend REST API con Node.js 20+, TypeScript y Express.js. Las tareas siguen el orden de dependencias: configuración del proyecto → infraestructura (env, DB) → seguridad y middlewares → utilidades → jobs → rutas → tests de integración.

## Tasks

- [x] 1. Inicializar estructura del proyecto y configuración base
  - Crear `package.json` con todas las dependencias de producción y desarrollo, y los scripts `dev`, `build`, `start`, `test`, `test:watch`, `test:coverage`
  - Crear `tsconfig.json` con `target: ES2020`, `rootDir: ./src`, `outDir: ./dist`, `strict: true`, `esModuleInterop: true`
  - Crear `vitest.config.ts` con `globals: true`, `environment: node` y cobertura con `@vitest/coverage-v8`
  - Crear `.env.example` con todas las variables requeridas: `PORT`, `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `NODE_ENV`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM`, `ANTHROPIC_API_KEY`
  - Crear `.gitignore` con `node_modules/`, `dist/`, `.env`, `coverage/`
  - Crear la estructura de directorios vacía bajo `src/`: `config/`, `models/`, `routes/`, `controllers/`, `services/`, `middlewares/`, `validators/`, `jobs/`, `utils/`, `types/`, `__tests__/unit/`, `__tests__/property/`, `__tests__/integration/`
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 2. Implementar validación de variables de entorno
  - [x] 2.1 Crear `src/config/env.ts` con el Zod schema `envSchema` y la función `validateEnv()`
    - Usar `z.coerce.number()` para `PORT` y `MAIL_PORT`
    - Exportar la interfaz `AppConfig` y la constante `config` (resultado de `validateEnv()`)
    - Si la validación falla, imprimir cada error de Zod y llamar a `process.exit(1)`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [x]* 2.2 Escribir unit tests para EnvValidator (`src/__tests__/unit/env.test.ts`)
    - Test: variables completas y válidas exportan `AppConfig` correctamente
    - Test: variable requerida ausente lanza error y llama `process.exit(1)`
    - Test: `PORT` como string numérico se coerce a `number`
    - Test: `MAIL_PORT` como string numérico se coerce a `number`
    - _Requirements: 1.1, 1.2, 1.5, 1.6_

  - [x]* 2.3 Escribir property tests para EnvValidator (`src/__tests__/property/env.property.test.ts`)
    - **Property 1: Validación de entorno rechaza configuraciones inválidas**
    - **Validates: Requirements 1.1, 1.2**
    - **Property 2: Coerción de tipos numéricos en variables de entorno**
    - **Validates: Requirements 1.5, 1.6**

- [x] 3. Implementar conexión a MongoDB Atlas
  - [x] 3.1 Crear `src/config/db.ts` con la función `connectDB()`
    - Llamar a `mongoose.connect(config.MONGODB_URI)`
    - En éxito: loguear el hostname de la conexión
    - En error: loguear el mensaje y llamar a `process.exit(1)`
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x]* 3.2 Escribir unit tests para DBConnector (`src/__tests__/unit/db.test.ts`)
    - Test: conexión exitosa loguea el hostname
    - Test: fallo de conexión loguea el error y llama `process.exit(1)`
    - _Requirements: 2.2, 2.3_

- [x] 4. Implementar definiciones de permisos RBAC
  - Crear `src/config/permissions.ts` con el enum `Role` (`ADMIN`, `USER`) y el mapa `PERMISSIONS`
  - _Requirements: 10.5_

- [x] 5. Implementar tipos globales de Express
  - Crear `src/types/express.d.ts` con la extensión de `Request` para incluir `user?: JwtPayload`
  - Definir la interfaz `JwtPayload` con `sub`, `email`, `role`, `iat?`, `exp?`
  - _Requirements: 5.2_

- [x] 6. Implementar middlewares de seguridad y validación
  - [x] 6.1 Crear `src/middlewares/rateLimiter.ts` con `express-rate-limit`
    - `windowMs: 15 * 60 * 1000`, `max: 100`, mensaje de error JSON descriptivo
    - _Requirements: 3.4, 3.5_

  - [x]* 6.2 Escribir property tests para RateLimiter (`src/__tests__/property/rateLimiter.property.test.ts`)
    - **Property 8: RateLimiter bloquea tras superar el límite**
    - **Validates: Requirements 3.4, 3.5**

  - [x] 6.3 Crear `src/middlewares/auth.middleware.ts` con la función `authMiddleware`
    - Extraer Bearer token del header `Authorization`
    - Verificar con `jwt.verify(token, config.JWT_SECRET)`
    - Adjuntar payload decodificado a `req.user`
    - Responder 401 si el header está ausente, el token es inválido o está expirado
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x]* 6.4 Escribir unit tests para AuthMiddleware (`src/__tests__/unit/auth.middleware.test.ts`)
    - Test: header ausente → 401
    - Test: token con firma incorrecta → 401
    - Test: token expirado → 401
    - Test: token válido → `req.user` poblado y `next()` llamado
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x]* 6.5 Escribir property tests para AuthMiddleware (`src/__tests__/property/auth.property.test.ts`)
    - **Property 5: AuthMiddleware rechaza tokens inválidos**
    - **Validates: Requirements 5.3, 5.4**
    - **Property 6: AuthMiddleware acepta tokens válidos**
    - **Validates: Requirements 5.1, 5.2**

  - [x] 6.6 Crear `src/middlewares/validate.middleware.ts` con la factory `validateBody<T>(schema)`
    - Usar `schema.safeParse(req.body)`
    - Si falla: responder 400 con array `{ field: string; message: string }[]`
    - Si pasa: llamar a `next()`
    - _Requirements: 6.1, 6.2, 6.3_

  - [x]* 6.7 Escribir unit tests para ValidateMiddleware (`src/__tests__/unit/validate.middleware.test.ts`)
    - Test: body válido llama `next()` sin modificar la respuesta
    - Test: body inválido responde 400 con array de errores con `field` y `message`
    - _Requirements: 6.1, 6.2, 6.3_

  - [x]* 6.8 Escribir property tests para ValidateMiddleware (`src/__tests__/property/validate.property.test.ts`)
    - **Property 3: Validación de body rechaza payloads inválidos**
    - **Validates: Requirements 6.1, 6.2, 6.3**
    - **Property 4: Validación de body acepta payloads válidos**
    - **Validates: Requirements 6.1, 6.2**

  - [x] 6.9 Crear `src/middlewares/errorHandler.middleware.ts` con el error handler centralizado
    - Leer `err.statusCode` o usar 500 como fallback
    - Responder con `{ success: false, message: string }`
    - _Requirements: 3.1_

- [x] 7. Checkpoint — Verificar middlewares
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implementar utilidades de negocio
  - [x] 8.1 Crear `src/utils/mail.util.ts` con la función `sendMail(options: MailOptions)`
    - Crear transporter de Nodemailer con `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`
    - Enviar email usando `MAIL_FROM` como remitente
    - Si el envío falla, lanzar `Error` con el mensaje SMTP original
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x]* 8.2 Escribir unit tests para MailService (`src/__tests__/unit/mail.util.test.ts`)
    - Test: `sendMail` llama al transporter con los parámetros correctos (mock del transporter)
    - Test: fallo SMTP lanza `Error` con mensaje descriptivo
    - _Requirements: 7.2, 7.3_

  - [x] 8.3 Crear `src/utils/excel.util.ts` con la función `generateExcel(...)`
    - Usar `ExcelJS.Workbook`, crear hoja, definir columnas, añadir filas
    - Retornar `Buffer` con `workbook.xlsx.writeBuffer()`
    - Si `rows` está vacío, retornar buffer con solo la fila de cabeceras
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x]* 8.4 Escribir unit tests para ExcelService (`src/__tests__/unit/excel.util.test.ts`)
    - Test: buffer no vacío para filas con datos
    - Test: buffer no vacío para array de filas vacío (solo cabeceras)
    - _Requirements: 8.2, 8.3_

  - [x]* 8.5 Escribir property tests para ExcelService (`src/__tests__/property/excel.property.test.ts`)
    - **Property 7: ExcelService genera buffer válido para cualquier conjunto de filas**
    - **Validates: Requirements 8.2, 8.3**

- [x] 9. Implementar JobScheduler
  - [x] 9.1 Crear `src/jobs/index.ts` con la función `initJobs()` y la interfaz `JobDefinition`
    - Iterar sobre definiciones de jobs y registrar cada uno con `cron.schedule()`
    - Wrapper de cada job: loguear nombre y timestamp al inicio
    - Capturar errores en handlers y logearlos sin detener el scheduler
    - Incluir al menos un job de ejemplo comentado
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x]* 9.2 Escribir unit tests para JobScheduler (`src/__tests__/unit/jobs.test.ts`)
    - Test: jobs se registran correctamente con `cron.schedule`
    - Test: errores en handlers son capturados y logueados sin propagar
    - _Requirements: 9.1, 9.2, 9.3_

- [x] 10. Implementar rutas y app Express
  - [x] 10.1 Crear `src/routes/health.route.ts` con `GET /health`
    - Responder 200 con `{ status: "ok", timestamp: string, uptime: number }`
    - No requiere autenticación
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 10.2 Crear `src/routes/index.ts` como agregador del API router (`/api/v1`)
    - Exportar `apiRouter` que agrupa todas las rutas de negocio
    - _Requirements: 10.1_

  - [x] 10.3 Crear `src/app.ts` con la configuración del stack de middlewares y registro de routers
    - Aplicar en orden: `helmet()`, `cors(corsOptions)`, `express.json()`, `rateLimiter`
    - Registrar `healthRouter` en `/health` y `apiRouter` en `/api/v1`
    - Registrar `errorHandler` como último middleware
    - Exportar `app` sin llamar a `app.listen()`
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 10.4 Crear `src/server.ts` como punto de entrada
    - Función `main()` que llama a `validateEnv()`, `connectDB()`, `initJobs()` y `app.listen()`
    - _Requirements: 1.1, 2.1, 9.4_

- [x] 11. Checkpoint — Verificar integración completa
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Escribir tests de integración para HealthEndpoint
  - [x]* 12.1 Crear `src/__tests__/integration/health.test.ts` usando `supertest`
    - Test: `GET /health` responde 200
    - Test: body contiene `{ status: "ok" }` y campos `timestamp` y `uptime`
    - Test: no requiere header `Authorization`
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 13. Checkpoint final — Verificar cobertura y calidad
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requisitos específicos para trazabilidad
- Los checkpoints garantizan validación incremental
- Los property tests validan propiedades universales de corrección (Properties 1–8 del diseño)
- Los unit tests validan ejemplos específicos y casos de borde
- El diseño usa TypeScript, por lo que todas las implementaciones deben ser en TypeScript
