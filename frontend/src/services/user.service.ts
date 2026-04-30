import axios from 'axios'

const API = '/api/users'

const getHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  },
})

export const listarUsuarios = async () => {
  const { data } = await axios.get(API, getHeaders())
  return data
}

export const editarUsuario = async (id: string, userData: object) => {
  const { data } = await axios.put(`${API}/${id}`, userData, getHeaders())
  return data
}

export const desactivarUsuario = async (id: string) => {
  const { data } = await axios.delete(`${API}/${id}`, getHeaders())
  return data
}

export const crearUsuario = async (userData: object) => {
  const { data } = await axios.post('/api/auth/users', userData, getHeaders())
  return data
}