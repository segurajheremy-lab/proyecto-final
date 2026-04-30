import { Attendance, AttendanceStatus } from '../models/Attendance.model'
import { User } from '../models/User.model'
import { AuditLog } from '../models/AuditLog.model'
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
// 6. LISTAR ASISTENCIA POR FECHA (ADMIN)
// ─────────────────────────────────────────
export const listarAsistenciaPorFechaService = async (fecha: string) => {
  return await Attendance.find({ fecha })
    .populate('userId', 'nombre email')
    .sort({ createdAt: -1 })
}

// ─────────────────────────────────────────
// 7. EDITAR ASISTENCIA (ADMIN)
// ─────────────────────────────────────────
export const editarAsistenciaService = async (
  attendanceId: string,
  adminId: string,
  cambios: Partial<any>,
  razon: string
) => {
  const asistencia = await Attendance.findById(attendanceId)
  if (!asistencia) throw new AppError('Registro de asistencia no encontrado', 404)

  // Guardar estado anterior para auditoría
  const antes = asistencia.toObject() as any

  // Aplicar cambios
  Object.assign(asistencia, cambios)
  asistencia.editadoPor = adminId as any

  await asistencia.save()

  // Crear log de auditoría
  await AuditLog.create({
    adminId,
    accion: 'EDIT_ATTENDANCE',
    coleccion: 'attendance',
    documentoId: attendanceId,
    cambios: {
      antes,
      despues: asistencia.toObject() as any,
    },
    razon,
  })

  return asistencia
}