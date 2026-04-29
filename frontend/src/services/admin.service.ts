import axios from 'axios'

const getHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  },
})

export const obtenerResumen = async (fecha: string) => {
  const { data } = await axios.get(`/api/attendance/resumen?fecha=${fecha}`, getHeaders())
  return data
}

export const descargarExcel = async (fecha: string) => {
  const response = await axios.get(`/api/reports/download?fecha=${fecha}`, {
    ...getHeaders(),
    responseType: 'blob',
  })
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `reporte-${fecha}.xlsx`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export const enviarReportePorCorreo = async (fecha: string, destinatario: string) => {
  const { data } = await axios.post(
    '/api/reporte',
    { fecha, destinatario },
    getHeaders()
  )
  return data
}
