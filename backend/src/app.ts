import express from 'express'
import cors from 'cors'
import { connectDB } from './config/db'
import { env } from './config/env'

const app = express()

// Middlewares globales
app.use(cors())
app.use(express.json())

// Ruta de salud — para verificar que el servidor corre
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', env: env.NODE_ENV })
})

// Arrancar servidor
const start = async () => {
  await connectDB()
  app.listen(env.PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${env.PORT}`)
  })
}

start()

export default app