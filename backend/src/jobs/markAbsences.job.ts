import cron from 'node-cron'
import { User } from '../models/User.model'
import { Attendance } from '../models/Attendance.model'
import { getFechaHoy } from '../utils/dates'

console.log('[jobs] Iniciando job: markAbsences')

cron.schedule('59 23 * * *', async () => {
  const fecha = getFechaHoy()
  console.log(`[jobs] markAbsences ejecutando para fecha: ${fecha}`)

  try {
    const workers = await User.find({ role: 'worker', activo: true }).select('_id')

    let faltas = 0

    for (const w of workers) {
      const existe = await Attendance.findOne({ userId: w._id, fecha })

      if (!existe) {
        await Attendance.create({ userId: w._id, fecha, status: 'falta' })
        faltas++
      } else if (existe.status === 'sin_jornada') {
        existe.status = 'falta'
        await existe.save()
        faltas++
      }
    }

    console.log(`[jobs] markAbsences: ${faltas} faltas registradas para ${fecha}`)
  } catch (err) {
    console.error('[jobs] markAbsences error:', err)
  }
})
