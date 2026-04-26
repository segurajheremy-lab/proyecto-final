import axios from 'axios'
import { IAuthResponse } from '../types/user.types'

const API = '/api/auth'

export const loginService = async (
  email: string,
  password: string
): Promise<IAuthResponse> => {
  const { data } = await axios.post(`${API}/login`, { email, password })
  return data
}