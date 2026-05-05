# Requirements Document

## Introduction

Este documento describe los requisitos para un proyecto backend con Node.js 20+, TypeScript y Express.js. El sistema provee una API REST con autenticación JWT, conexión a MongoDB Atlas, validación de datos con Zod, seguridad reforzada (CORS, Helmet, rate limiting), envío de emails, generación de archivos Excel y ejecución de jobs programados. El objetivo es establecer una base sólida, lista para producción, sobre la que construir funcionalidades de negocio.

## Glossary

- **Server**: La aplicación Express.js que escucha peticiones HTTP.
- **EnvValidator**: El módulo `env.ts` responsable de validar las variables de entorno al arrancar.
- **DBConnector**: El módulo `db.ts` responsable de establecer la conexión con MongoDB Atlas.
- **Router**: El subsistema de Express que registra y despacha rutas HTTP.
- **AuthMiddleware**: El middleware que verifica y decodifica tokens JWT en las peticiones entrantes.
- **RateLimiter**: El middleware `express-rate-limit` que limita el número de peticiones por IP.
- **MailService**: El módulo de utilidades que envía correos electrónicos usando Nodemailer.
- **ExcelService**: El módulo de utilidades que genera archivos Excel usando ExcelJS.
- **JobScheduler**: El subsistema que registra y ejecuta tareas programadas con node-cron.
- **HealthEndpoint**: La ruta `GET /health` que informa el estado del servidor.
- **JWT**: JSON Web Token, estándar para autenticación sin estado.
- **Schema**: Definición de validación de datos creada con Zod.

---

## Requirements

### Requirement 1: Validación de Variables de Entorno al Arranque

**User Story:** As a developer, I want all required environment variables to be validated at startup, so that the server never runs with a missing or malformed configuration.

#### Acceptance Criteria

1. WHEN the Server starts, THE EnvValidator SHALL parse all environment variables defined in `.env.example` using a Zod schema.
2. IF one or more required environment variables are missing or invalid, THEN THE EnvValidator SHALL log the name of each missing or invalid variable and terminate the process with exit code 1.
3. WHEN all environment variables are present and valid, THE EnvValidator SHALL export a typed configuration object accessible to all modules.
4. THE EnvValidator SHALL validate the following variables: `PORT`, `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `NODE_ENV`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM`, `ANTHROPIC_API_KEY`.
5. WHEN `PORT` is provided, THE EnvValidator SHALL coerce its value to a number before exporting it.
6. WHEN `MAIL_PORT` is provided, THE EnvValidator SHALL coerce its value to a number before exporting it.

---

### Requirement 2: Conexión a MongoDB Atlas

**User Story:** As a developer, I want the application to connect to MongoDB Atlas on startup, so that all data operations are available when the server begins accepting requests.

#### Acceptance Criteria

1. WHEN the Server starts, THE DBConnector SHALL establish a connection to MongoDB Atlas using the `MONGODB_URI` environment variable via Mongoose.
2. WHEN the connection is established successfully, THE DBConnector SHALL log a success message that includes the host name of the connected database.
3. IF the connection attempt fails, THEN THE DBConnector SHALL log the error message and terminate the process with exit code 1.
4. WHILE the Server is running, THE DBConnector SHALL maintain the Mongoose connection and allow models to perform database operations.

---

### Requirement 3: Configuración de Seguridad HTTP

**User Story:** As a security engineer, I want the server to apply HTTP security headers and CORS policies on every response, so that common web vulnerabilities are mitigated by default.

#### Acceptance Criteria

1. THE Server SHALL apply Helmet middleware to set secure HTTP headers on all responses.
2. THE Server SHALL apply CORS middleware to control cross-origin resource sharing on all responses.
3. THE Server SHALL parse incoming JSON request bodies using `express.json()` middleware.
4. THE Server SHALL apply the RateLimiter globally, allowing a maximum of 100 requests per 15-minute window per IP address.
5. IF a client exceeds 100 requests within a 15-minute window, THEN THE RateLimiter SHALL respond with HTTP status 429 and a descriptive error message.

---

### Requirement 4: Ruta de Health Check

**User Story:** As a DevOps engineer, I want a `/health` endpoint, so that load balancers and monitoring tools can verify the server is running.

#### Acceptance Criteria

1. WHEN a `GET /health` request is received, THE HealthEndpoint SHALL respond with HTTP status 200.
2. WHEN a `GET /health` request is received, THE HealthEndpoint SHALL return a JSON body containing at minimum the field `status` with value `"ok"`.
3. THE HealthEndpoint SHALL respond to `GET /health` requests without requiring authentication.

---

### Requirement 5: Autenticación con JWT

**User Story:** As a developer, I want a reusable JWT authentication middleware, so that protected routes can verify the identity of the caller.

#### Acceptance Criteria

1. WHEN a request to a protected route is received, THE AuthMiddleware SHALL extract the Bearer token from the `Authorization` header.
2. WHEN a valid JWT is provided, THE AuthMiddleware SHALL decode the token using `JWT_SECRET` and attach the decoded payload to the request object.
3. IF the `Authorization` header is absent or does not contain a Bearer token, THEN THE AuthMiddleware SHALL respond with HTTP status 401 and a descriptive error message.
4. IF the JWT is expired or its signature is invalid, THEN THE AuthMiddleware SHALL respond with HTTP status 401 and a descriptive error message.
5. THE AuthMiddleware SHALL use `jsonwebtoken` to sign and verify tokens with the `JWT_SECRET` and `JWT_EXPIRES_IN` configuration values.

---

### Requirement 6: Validación de Datos de Entrada

**User Story:** As a developer, I want a validation layer using Zod schemas, so that invalid request payloads are rejected before reaching business logic.

#### Acceptance Criteria

1. THE Server SHALL provide a reusable validation middleware factory that accepts a Zod Schema and validates `req.body` against it.
2. WHEN `req.body` conforms to the provided Schema, THE validation middleware SHALL call the next middleware in the chain.
3. IF `req.body` does not conform to the provided Schema, THEN THE validation middleware SHALL respond with HTTP status 400 and a JSON body listing each validation error with its field path and message.
4. THE Server SHALL store all Zod schemas in the `src/validators/` directory.

---

### Requirement 7: Envío de Correos Electrónicos

**User Story:** As a developer, I want a mail utility module, so that any service can send transactional emails without duplicating SMTP configuration.

#### Acceptance Criteria

1. THE MailService SHALL configure a Nodemailer transporter using `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, and `MAIL_PASS` environment variables.
2. WHEN `sendMail` is called with a recipient address, subject, and body, THE MailService SHALL send the email using the configured transporter and the `MAIL_FROM` address as sender.
3. IF the email delivery fails, THEN THE MailService SHALL throw an error with a descriptive message that includes the original SMTP error.
4. THE MailService SHALL be located in `src/utils/` and export a `sendMail` function.

---

### Requirement 8: Generación de Archivos Excel

**User Story:** As a developer, I want an Excel utility module, so that any service can generate `.xlsx` files from structured data.

#### Acceptance Criteria

1. THE ExcelService SHALL use ExcelJS to create workbooks and worksheets programmatically.
2. WHEN `generateExcel` is called with a sheet name, column definitions, and an array of row data, THE ExcelService SHALL return a `Buffer` containing the `.xlsx` file content.
3. IF the row data array is empty, THE ExcelService SHALL return a `Buffer` containing a valid `.xlsx` file with only the header row.
4. THE ExcelService SHALL be located in `src/utils/` and export a `generateExcel` function.

---

### Requirement 9: Jobs Programados

**User Story:** As a developer, I want a job scheduling module using node-cron, so that recurring background tasks can be registered and executed on a defined schedule.

#### Acceptance Criteria

1. THE JobScheduler SHALL register cron jobs using node-cron with a valid cron expression.
2. WHEN a scheduled job executes, THE JobScheduler SHALL log the job name and execution timestamp.
3. IF a scheduled job throws an error during execution, THEN THE JobScheduler SHALL catch the error, log it with the job name, and continue scheduling future executions.
4. THE JobScheduler SHALL initialize all registered jobs when the Server starts, after the database connection is established.
5. THE Server SHALL store all job definitions in the `src/jobs/` directory.

---

### Requirement 10: Estructura de Proyecto y Configuración de TypeScript

**User Story:** As a developer, I want a well-defined project structure and TypeScript configuration, so that the codebase is maintainable and the build process is predictable.

#### Acceptance Criteria

1. THE Server SHALL organize source code under `src/` with subdirectories: `config/`, `models/`, `routes/`, `controllers/`, `services/`, `middlewares/`, `validators/`, `jobs/`, and `utils/`.
2. THE Server SHALL include a `tsconfig.json` with `target` set to `ES2020`, `rootDir` set to `./src`, and `outDir` set to `./dist`.
3. THE Server SHALL include a `package.json` with the following scripts:
   - `dev`: runs the server in development mode using nodemon and ts-node.
   - `build`: compiles TypeScript to JavaScript using `tsc`.
   - `start`: runs the compiled output from `dist/app.js` using Node.js.
4. THE Server SHALL include a `.env.example` file listing all required environment variables with placeholder values.
5. THE Server SHALL include a `src/config/permissions.ts` file for centralizing role-based access control definitions.
