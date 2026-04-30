import express from 'express'
import cors from 'cors'
import { connectDB } from './config/db'
import { env } from './config/env'
import { errorHandler } from './middlewares/errorHandler'
import authRoutes from './routes/auth.routes'
import attendanceRoutes from './routes/attendance.routes'
import reporteRoutes from './routes/reporte.routes' //  IMPORTANTE
import userRoutes from './routes/user.routes'

import './jobs/markAbsences.job'
import './jobs/sendDailyReport.job'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', env: env.NODE_ENV })
})

// Rutas
app.use('/api/auth', authRoutes)
app.use('/api/attendance', attendanceRoutes)
app.use('/api/reporte', reporteRoutes)
app.use('/api/reports', reporteRoutes)
app.use('/api/users', userRoutes)

// Manejador de errores — siempre al final
app.use(errorHandler)

const start = async () => {
  await connectDB()
  // Iniciar jobs programados que requieren DB
  app.listen(env.PORT, () => {
    console.log(`Servidor corriendo en el puerto: ${env.PORT}`)
  })
}

start()

export default app