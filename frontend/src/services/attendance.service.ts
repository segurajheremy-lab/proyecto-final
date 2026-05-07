import axios from 'axios'
import { IAttendanceState } from '../types/attendance.types'

const API = '/api/attendance'

const getHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  },
})

export const obtenerEstadoHoy = async (): Promise<IAttendanceState> => {
  const { data } = await axios.get(`${API}/hoy`, getHeaders())
  return data
}

export const iniciarJornada = async (): Promise<unknown> => {
  const { data } = await axios.post(`${API}/iniciar`, {}, getHeaders())
  return data
}

export const salirRefrigerio = async (): Promise<unknown> => {
  const { data } = await axios.post(`${API}/refrigerio/salir`, {}, getHeaders())
  return data
}

export const volverRefrigerio = async (): Promise<unknown> => {
  const { data } = await axios.post(`${API}/refrigerio/volver`, {}, getHeaders())
  return data
}

export const finalizarJornada = async (): Promise<unknown> => {
  const { data } = await axios.post(`${API}/finalizar`, {}, getHeaders())
  return data
}

export const obtenerHistorial = async () => {
  const { data } = await axios.get('/api/attendance/historial', getHeaders())
  return data
}