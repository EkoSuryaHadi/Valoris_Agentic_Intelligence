import { validateProject } from './project.js';

export function createProject({ organizationId, existingProjects, payload }) {
  if (!organizationId?.trim()) throw new Error('organization is required');
  const normalized = validateProject(payload);
  const code = normalized.code.toUpperCase();
  if (existingProjects.some((project) => project.organizationId === organizationId && project.code.toUpperCase() === code)) {
    throw new Error('project code already exists in this organization');
  }
  return { organizationId, ...normalized, code, status: 'DRAFT' };
}
