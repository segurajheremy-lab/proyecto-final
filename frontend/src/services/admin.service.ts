import axios from 'axios'

const API = '/api/attendance'

const getHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  },
})

export const getDailySummary = async () => {
  const today = new Date()
  // Ajuste al formato YYYY-MM-DD local
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  const fecha = `${year}-${month}-${day}`
  
  const { data } = await axios.get(`${API}/resumen?fecha=${fecha}`, getHeaders())
  return data
}
