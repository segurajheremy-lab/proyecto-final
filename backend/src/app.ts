import express from 'express'
import cors from 'cors'
import { connectDB } from './config/db'
import { env } from './config/env'
import { errorHandler } from './middlewares/errorHandler'
import authRoutes from './routes/auth.routes'
import attendanceRoutes from './routes/attendance.routes'


const app = express()

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', env: env.NODE_ENV })
})

// Rutas
app.use('/api/auth', authRoutes)
app.use('/api/attendance', attendanceRoutes)

// Manejador de errores — siempre al final
app.use(errorHandler)

const start = async () => {
  await connectDB()
  app.listen(env.PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto: http://localhost:${env.PORT}`)
  })
}

start()

export default app