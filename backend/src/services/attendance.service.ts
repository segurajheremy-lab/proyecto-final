 import { Attendance, AttendanceStatus } from '../models/Attendance.model'
import { User } from '../models/User.model'
import { AppError } from '../middlewares/errorHandler'
import { getFechaHoy, calcularTardanza, calcularHorasTrabajadas, diffMinutes } from '../utils/dates'

// Máquina de estados — qué transiciones son válidas
const TRANSICIONES_VALIDAS: Record<string, AttendanceStatus[]> = {
  sin_jornada: ['jornada_activa'],
  jornada_activa: ['en_refrigerio', 'finalizado'],
  en_refrigerio: ['post_refrigerio'],
  post_refrigerio: ['finalizado'],
  finalizado: [],
  falta: [],
  falta_justificada: [],
}

const validarTransicion = (estadoActual: AttendanceStatus, estadoNuevo: AttendanceStatus) => {
  const permitidos = TRANSICIONES_VALIDAS[estadoActual]
  if (!permitidos.includes(estadoNuevo)) {
    throw new AppError(
      `No puedes pasar de "${estadoActual}" a "${estadoNuevo}"`,
      400
    )
  }
}

// ─────────────────────────────────────────
// 1. INICIAR JORNADA
// ─────────────────────────────────────────
export const iniciarJornadaService = async (userId: string) => {
  const user = await User.findById(userId)
  if (!user) throw new AppError('Usuario no encontrado', 404)

  const fecha = getFechaHoy()

  // Buscar si ya existe un registro hoy
  let asistencia = await Attendance.findOne({ userId, fecha })

  if (asistencia) {
    validarTransicion(asistencia.status, 'jornada_activa')
  }

  const ahora = new Date()
  const { tardanza, minutosTardanza } = calcularTardanza(
    ahora,
    user.horario.entrada,
    user.toleranciaMinutos
  )

  // Si no existe registro hoy, lo creamos
  if (!asistencia) {
    asistencia = new Attendance({
      userId,
      fecha,
      status: 'sin_jornada',
      eventos: [],
    })
  }

  asistencia.status = 'jornada_activa'
  asistencia.tardanza = tardanza
  asistencia.minutosTardanza = minutosTardanza
  asistencia.eventos.push({
    tipo: 'inicio',
    timestamp: ahora,
    metodo: 'manual',
  })

  await asistencia.save()

  return {
    mensaje: tardanza
      ? `Jornada iniciada con ${minutosTardanza} minutos de tardanza`
      : 'Jornada iniciada puntualmente',
    tardanza,
    minutosTardanza,
    hora: ahora,
  }
}

// ─────────────────────────────────────────
// 2. SALIR A REFRIGERIO
// ─────────────────────────────────────────
export const salirRefrigerioService = async (userId: string) => {
  const fecha = getFechaHoy()
  const asistencia = await Attendance.findOne({ userId, fecha })

  if (!asistencia) throw new AppError('No has iniciado jornada hoy', 400)

  validarTransicion(asistencia.status, 'en_refrigerio')

  const ahora = new Date()
  asistencia.status = 'en_refrigerio'
  asistencia.eventos.push({
    tipo: 'salida_refrigerio',
    timestamp: ahora,
    metodo: 'manual',
  })

  await asistencia.save()

  return {
    mensaje: 'Salida a refrigerio registrada',
    hora: ahora,
  }
}

// ─────────────────────────────────────────
// 3. VOLVER DE REFRIGERIO
// ─────────────────────────────────────────
export const volverRefrigerioService = async (userId: string) => {
  const fecha = getFechaHoy()
  const asistencia = await Attendance.findOne({ userId, fecha })

  if (!asistencia) throw new AppError('No has iniciado jornada hoy', 400)

  validarTransicion(asistencia.status, 'post_refrigerio')

  const ahora = new Date()

  // Calcular minutos de refrigerio
  const eventoSalida = asistencia.eventos.find(e => e.tipo === 'salida_refrigerio')
  const minutosRefrigerio = eventoSalida
    ? diffMinutes(eventoSalida.timestamp, ahora)
    : 0

  // Marcar si el refrigerio fue corto o excedido
  let mensajeRefrigerio = 'Regreso de refrigerio registrado'
  if (minutosRefrigerio < 30) {
    mensajeRefrigerio = `Refrigerio corto: solo ${minutosRefrigerio} minutos`
  } else if (minutosRefrigerio > 90) {
    mensajeRefrigerio = `Refrigerio excedido: ${minutosRefrigerio} minutos`
  }

  asistencia.status = 'post_refrigerio'
  asistencia.minutosRefrigerio = minutosRefrigerio
  asistencia.eventos.push({
    tipo: 'vuelta_refrigerio',
    timestamp: ahora,
    metodo: 'manual',
  })

  await asistencia.save()

  return {
    mensaje: mensajeRefrigerio,
    minutosRefrigerio,
    hora: ahora,
  }
}

// ─────────────────────────────────────────
// 4. FINALIZAR JORNADA
// ─────────────────────────────────────────
export const finalizarJornadaService = async (userId: string) => {
  const fecha = getFechaHoy()
  const asistencia = await Attendance.findOne({ userId, fecha })

  if (!asistencia) throw new AppError('No has iniciado jornada hoy', 400)

  validarTransicion(asistencia.status, 'finalizado')

  const ahora = new Date()

  // Calcular horas trabajadas
  const eventoInicio = asistencia.eventos.find(e => e.tipo === 'inicio')
  const minutosRefrigerio = asistencia.minutosRefrigerio ?? 0
  const horasTrabajadas = eventoInicio
    ? calcularHorasTrabajadas(eventoInicio.timestamp, ahora, minutosRefrigerio)
    : 0

  asistencia.status = 'finalizado'
  asistencia.horasTrabajadas = horasTrabajadas
  asistencia.eventos.push({
    tipo: 'fin',
    timestamp: ahora,
    metodo: 'manual',
  })

  await asistencia.save()

  return {
    mensaje: 'Jornada finalizada',
    horasTrabajadas,
    minutosRefrigerio,
    tardanza: asistencia.tardanza,
    minutosTardanza: asistencia.minutosTardanza,
    hora: ahora,
  }
}

// ─────────────────────────────────────────
// 5. OBTENER ESTADO ACTUAL DEL DÍA
// ─────────────────────────────────────────
export const obtenerEstadoHoyService = async (userId: string) => {
  const fecha = getFechaHoy()
  const asistencia = await Attendance.findOne({ userId, fecha })

  if (!asistencia) {
    return { status: 'sin_jornada', fecha, eventos: [] }
  }

  return {
    status: asistencia.status,
    fecha: asistencia.fecha,
    tardanza: asistencia.tardanza,
    minutosTardanza: asistencia.minutosTardanza,
    minutosRefrigerio: asistencia.minutosRefrigerio,
    horasTrabajadas: asistencia.horasTrabajadas,
    eventos: asistencia.eventos,
  }
}

// ─────────────────────────────────────────
// 6. HISTORIAL DE LOS ÚLTIMOS 30 DÍAS
// ─────────────────────────────────────────
export const obtenerHistorialService = async (userId: string) => {
  const hace30Dias = new Date()
  hace30Dias.setDate(hace30Dias.getDate() - 30)
  const fechaInicio = hace30Dias.toISOString().split('T')[0]
  const fechaHoy = new Date().toISOString().split('T')[0]

  const registros = await Attendance.find({
    userId,
    fecha: { $gte: fechaInicio, $lte: fechaHoy },
  }).sort({ fecha: -1 })

  const diasAsistidos = registros.filter(r =>
    ['jornada_activa', 'en_refrigerio', 'post_refrigerio', 'finalizado'].includes(r.status)
  ).length
  const diasFalta = registros.filter(r =>
    ['falta', 'falta_justificada'].includes(r.status)
  ).length
  const tardanzas = registros.filter(r => r.tardanza).length
  const horasTotal = registros.reduce((acc, r) => acc + (r.horasTrabajadas ?? 0), 0)
  const promedioHoras = diasAsistidos > 0
    ? Math.round((horasTotal / diasAsistidos) * 100) / 100
    : 0

  return {
    resumen: {
      totalDias: registros.length,
      diasAsistidos,
      diasFalta,
      tardanzas,
      promedioHoras,
    },
    registros: registros.map(r => ({
      fecha: r.fecha,
      status: r.status,
      tardanza: r.tardanza,
      minutosTardanza: r.minutosTardanza,
      minutosRefrigerio: r.minutosRefrigerio,
      horasTrabajadas: r.horasTrabajadas,
    })),
  }
}

// ─────────────────────────────────────────
// 7. OBTENER RESUMEN (ADMIN) - EFICIENTE CON AGGREGATION
// ─────────────────────────────────────────
export const obtenerResumenService = async (fecha: string) => {
  const result = await User.aggregate([
    { $match: { role: 'worker', activo: true } },
    {
      $lookup: {
        from: 'attendances',
        let: { userId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$userId', '$$userId'] },
                  { $eq: ['$fecha', fecha] }
                ]
              }
            }
          }
        ],
        as: 'asistencia'
      }
    },
    {
      $unwind: {
        path: '$asistencia',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $project: {
        _id: 1,
        nombre: 1,
        email: 1,
        status: { $ifNull: ['$asistencia.status', 'sin_jornada'] },
        tardanza: { $ifNull: ['$asistencia.tardanza', false] },
        horasTrabajadas: { $ifNull: ['$asistencia.horasTrabajadas', 0] }
      }
    },
    {
      $group: {
        _id: null,
        totalWorkers: { $sum: 1 },
        presentes: {
          $sum: {
            $cond: [
              { $in: ['$status', ['jornada_activa', 'en_refrigerio', 'post_refrigerio', 'finalizado']] },
              1, 0
            ]
          }
        },
        faltas: {
          $sum: {
            $cond: [
              { $in: ['$status', ['falta', 'falta_justificada']] },
              1, 0
            ]
          }
        },
        tardanzas: {
          $sum: { $cond: ['$tardanza', 1, 0] }
        },
        enJornada: {
          $sum: {
            $cond: [
              { $in: ['$status', ['jornada_activa', 'en_refrigerio', 'post_refrigerio']] },
              1, 0
            ]
          }
        },
        finalizados: {
          $sum: {
            $cond: [
              { $eq: ['$status', 'finalizado'] },
              1, 0
            ]
          }
        },
        trabajadores: {
          $push: {
            nombre: '$nombre',
            email: '$email',
            status: '$status',
            tardanza: '$tardanza',
            horasTrabajadas: '$horasTrabajadas'
          }
        }
      }
    }
  ])

  if (!result || result.length === 0) {
    return {
      totalWorkers: 0,
      presentes: 0,
      faltas: 0,
      tardanzas: 0,
      enJornada: 0,
      finalizados: 0,
      trabajadores: []
    }
  }

  const { _id, ...resumen } = result[0]
  return resumen
}