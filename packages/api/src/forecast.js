import { calculateForecast } from '../../domain/src/forecast.js';

export function calculateForecastResponse({ user, project, period, body, idempotencyKey }) {
  if (!idempotencyKey?.trim()) return { status: 400, body: { error: { code: 'IDEMPOTENCY_KEY_REQUIRED', message: 'Idempotency-Key is required' } } };
  if (!user || !project || user.organizationId !== project.organizationId || user.projectId !== project.id || period.projectId !== project.id) return { status: 403, body: { error: { code: 'PROJECT_SCOPE_DENIED', message: 'project scope is not authorized' } } };
  try { return { status: 200, body: { data: calculateForecast({ ...body, periodStatus: period.status }), meta: { idempotencyKey } } }; }
  catch (error) { return { status: 422, body: { error: { code: 'FORECAST_VALIDATION_FAILED', message: error.message } } }; }
}
