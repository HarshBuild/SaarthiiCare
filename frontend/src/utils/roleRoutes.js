/**
 * Single source of truth for which dashboard a role lands on.
 *
 * The backend profile row is authoritative for role; this helper only maps the
 * role string to a route. Unknown or missing roles fall back to the PHC
 * dashboard, matching the historical default for legacy/admin accounts without
 * a Supabase profile.
 */
export const ROLE_DASHBOARDS = {
  phc_staff: '/phc-dashboard',
  hospital_staff: '/hospital-dashboard',
  supervisor: '/supervisor-dashboard',
  admin: '/supervisor-dashboard',
}

export function dashboardPathForRole(role) {
  return ROLE_DASHBOARDS[role] || ROLE_DASHBOARDS.phc_staff
}
