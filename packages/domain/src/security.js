const capabilities = {
  ADMIN: ['EDIT_PROJECT', 'EDIT_FORECAST', 'APPROVE_BASELINE', 'LOCK_PERIOD'],
  PROJECT_MANAGER: ['EDIT_PROJECT', 'EDIT_FORECAST', 'APPROVE_BASELINE'],
  COST_MANAGER: ['EDIT_FORECAST', 'APPROVE_BASELINE', 'LOCK_PERIOD'],
  COST_ENGINEER: ['EDIT_PROJECT', 'EDIT_FORECAST'],
  VIEWER: [],
  AGENT: [],
};

export function authorizeProjectAction({ user, project, action }) {
  if (!user || !project || user.organizationId !== project.organizationId || user.projectId !== project.id) return false;
  return capabilities[user.role]?.includes(action) ?? false;
}
