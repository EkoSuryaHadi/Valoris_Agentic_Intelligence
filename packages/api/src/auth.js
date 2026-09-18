export function authenticateClaims(claims) {
  if (!claims?.sub || !claims.org_id || !claims.project_id || !claims.role) throw new Error('required JWT claims are missing');
  return { userId: claims.sub, organizationId: claims.org_id, projectId: claims.project_id, role: claims.role };
}
export function requireProjectContext(user, project) {
  if (!user || !project || user.organizationId !== project.organizationId || user.projectId !== project.id) throw new Error('project scope denied');
  return true;
}
