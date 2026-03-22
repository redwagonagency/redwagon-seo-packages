export const JOE_ADMIN_EMAIL = "joe@redwagon.agency";

export function isJoeSuperAdmin(email: string | null | undefined): boolean {
  return (email || "").toLowerCase() === JOE_ADMIN_EMAIL;
}
