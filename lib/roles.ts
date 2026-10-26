export const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"] as const;
export const CLIENT_ROLES = ["CLIENT", "CUSTOMER"] as const;

export function isAdminRole(role: string) {
  return ADMIN_ROLES.includes(role as (typeof ADMIN_ROLES)[number]);
}

export function isClientRole(role: string) {
  return CLIENT_ROLES.includes(role as (typeof CLIENT_ROLES)[number]);
}
