export function selectActiveProject(projects, preferredId) {
  if (!Array.isArray(projects) || projects.length === 0) return null;
  return projects.find((project) => project.id === preferredId) || projects[0];
}
