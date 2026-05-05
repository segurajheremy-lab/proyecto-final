// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

/**
 * All roles in the platform, ordered from highest to lowest privilege.
 * This order is used by canManageRole() to enforce hierarchy.
 */
export type Role =
  | 'super_admin'
  | 'owner'
  | 'admin'
  | 'sub_admin'
  | 'supervisor'
  | 'agent';

/** Numeric hierarchy — lower index = higher privilege */
const ROLE_HIERARCHY: Role[] = [
  'super_admin',
  'owner',
  'admin',
  'sub_admin',
  'supervisor',
  'agent',
];

// ---------------------------------------------------------------------------
// Permissions map
// ---------------------------------------------------------------------------

/**
 * Maps every permission to the roles that hold it.
 * Add new permissions here — TypeScript will enforce the shape everywhere.
 */
export const PERMISSIONS = {
  // --- Tenant management ---
  VIEW_ALL_TENANTS:       ['super_admin'],
  MANAGE_TENANT:          ['super_admin'],
  VIEW_OWN_TENANT:        ['owner', 'admin', 'sub_admin', 'supervisor', 'agent'],
  CONFIGURE_TENANT:       ['owner'],

  // --- User management ---
  CREATE_ADMIN:           ['owner'],
  CREATE_SUB_ADMIN:       ['admin'],
  CREATE_SUPERVISOR:      ['admin', 'sub_admin'],
  CREATE_AGENT:           ['admin', 'sub_admin'],
  EDIT_USER:              ['admin', 'sub_admin'],
  DEACTIVATE_USER:        ['admin'],
  VIEW_ALL_USERS:         ['owner', 'admin', 'sub_admin'],
  VIEW_TEAM_USERS:        ['supervisor'],

  // --- Attendance ---
  MARK_ATTENDANCE:        ['agent'],
  VIEW_OWN_ATTENDANCE:    ['agent'],
  VIEW_TEAM_ATTENDANCE:   ['supervisor', 'sub_admin'],
  VIEW_ALL_ATTENDANCE:    ['admin', 'owner'],
  EDIT_ATTENDANCE:        ['admin', 'sub_admin'],

  // --- Clients ---
  CREATE_CLIENT:          ['supervisor'],
  ASSIGN_CLIENT:          ['supervisor'],
  VIEW_ASSIGNED_CLIENTS:  ['agent'],
  VIEW_TEAM_CLIENTS:      ['supervisor', 'sub_admin'],
  VIEW_ALL_CLIENTS:       ['admin', 'owner'],
  EDIT_CLIENT:            ['supervisor'],
  DELETE_CLIENT:          ['admin'],

  // --- Interactions ---
  CREATE_INTERACTION:     ['agent'],
  VIEW_OWN_INTERACTIONS:  ['agent'],
  VIEW_TEAM_INTERACTIONS: ['supervisor', 'sub_admin'],
  VIEW_ALL_INTERACTIONS:  ['admin', 'owner'],

  // --- Reports ---
  GENERATE_TEAM_REPORT:   ['supervisor'],
  GENERATE_AREA_REPORT:   ['sub_admin'],
  GENERATE_FULL_REPORT:   ['admin', 'owner'],
  SEND_REPORT:            ['admin', 'sub_admin', 'supervisor'],

  // --- AI & Alerts ---
  VIEW_SENTIMENT_ALERTS:  ['supervisor', 'sub_admin', 'admin'],
  MANAGE_AI_CONFIG:       ['admin'],
} as const satisfies Record<string, Role[]>;

/** Union type of every permission key */
export type Permission = keyof typeof PERMISSIONS;

// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

/**
 * Returns true if the given role holds the requested permission.
 *
 * @example
 * hasPermission('supervisor', 'VIEW_TEAM_CLIENTS') // true
 * hasPermission('agent',      'DELETE_CLIENT')     // false
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}

/**
 * Returns true if `managerRole` is allowed to create / manage `targetRole`.
 * A role can only manage roles that are strictly below it in the hierarchy.
 *
 * @example
 * canManageRole('admin',    'supervisor') // true
 * canManageRole('agent',    'supervisor') // false
 * canManageRole('admin',    'admin')      // false  (cannot manage same level)
 * canManageRole('owner',    'agent')      // true
 */
export function canManageRole(managerRole: Role, targetRole: Role): boolean {
  const managerIndex = ROLE_HIERARCHY.indexOf(managerRole);
  const targetIndex  = ROLE_HIERARCHY.indexOf(targetRole);

  // Both roles must be valid and manager must be strictly higher
  return managerIndex !== -1 && targetIndex !== -1 && managerIndex < targetIndex;
}
