export type Role = 'super_admin' | 'admin' | 'reporter' | 'worker'

export interface Horario {
  entrada: string
  salidaRefrigerio: string
  vueltaRefrigerio: string
  salida: string
}

export interface IUser {
  id: string
  nombre: string
  email: string
  role: Role
  horario: Horario
}

export interface IAuthResponse {
  token: string
  user: IUser
}