import { buildExecutiveSummary } from '../../domain/src/reporting.js';
export function executiveSummaryResponse({ user, project, body }) {
  if (!user || !project || user.organizationId !== project.organizationId || user.projectId !== project.id) return { status: 403, body: { error: { code: 'PROJECT_SCOPE_DENIED', message: 'project scope is not authorized' } } };
  try { return { status: 200, body: { data: buildExecutiveSummary(body), meta: { readOnly: true } } }; }
  catch (error) { return { status: 422, body: { error: { code: 'REPORT_VALIDATION_FAILED', message: error.message } } }; }
}
