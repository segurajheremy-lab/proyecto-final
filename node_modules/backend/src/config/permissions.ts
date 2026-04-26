export const ROLES = {
  SUPER_ADMIN: 'super_admin',   // todo el sistema
  ADMIN: 'admin',               // gestiona usuarios y asistencia
  REPORTER: 'reporter',         // solo ve reportes
  WORKER: 'worker',             // solo marca asistencia
} as const

export type Role = typeof ROLES[keyof typeof ROLES]

export const PERMISSIONS = {
  // Usuarios
  CREATE_USER: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  EDIT_USER: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  DELETE_USER: [ROLES.SUPER_ADMIN],
  VIEW_USERS: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.REPORTER],

  // Asistencia
  MARK_ATTENDANCE: [ROLES.WORKER],
  VIEW_OWN_ATTENDANCE: [ROLES.WORKER],
  VIEW_ALL_ATTENDANCE: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.REPORTER],
  EDIT_ATTENDANCE: [ROLES.SUPER_ADMIN, ROLES.ADMIN],

  // Reportes
  VIEW_REPORTS: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.REPORTER],
  SEND_REPORTS: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
} as const

export type Permission = keyof typeof PERMISSIONS