import { Role } from '../types/user.types'

const PERMISSIONS = {
  CREATE_USER: ['super_admin', 'admin'],
  EDIT_USER: ['super_admin', 'admin'],
  DELETE_USER: ['super_admin'],
  VIEW_USERS: ['super_admin', 'admin', 'reporter'],
  MARK_ATTENDANCE: ['worker'],
  VIEW_ALL_ATTENDANCE: ['super_admin', 'admin', 'reporter'],
  VIEW_REPORTS: ['super_admin', 'admin', 'reporter'],
} as const

type Permission = keyof typeof PERMISSIONS

export const tienePermiso = (role: Role, permission: Permission): boolean => {
  return (PERMISSIONS[permission] as readonly string[]).includes(role)
}