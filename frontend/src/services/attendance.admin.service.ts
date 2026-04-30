import axios from 'axios'

const API = '/api/attendance/admin'

// Configurar axios para incluir el token en todas las peticiones
const getAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  },
})

export const listarAsistenciaPorFecha = async (fecha: string) => {
  const { data } = await axios.get(`${API}?fecha=${fecha}`, getAuthHeaders())
  return data
}

export const editarAsistencia = async (id: string, updateData: Record<string, unknown>) => {
  const { data } = await axios.put(`${API}/${id}`, updateData, getAuthHeaders())
  return data
}
