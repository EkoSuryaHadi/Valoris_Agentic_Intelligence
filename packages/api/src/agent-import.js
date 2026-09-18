import { createFinding, reviewFinding } from '../../domain/src/agent.js';
import { validateImportRows } from '../../domain/src/import.js';
function scope(input) { return input.user && input.project && input.user.organizationId === input.project.organizationId && input.user.projectId === input.project.id; }
function guard(input) { if (!input.idempotencyKey?.trim()) return { status: 400, body: { error: { code: 'IDEMPOTENCY_KEY_REQUIRED', message: 'Idempotency-Key is required' } } }; if (!scope(input)) return { status: 403, body: { error: { code: 'PROJECT_SCOPE_DENIED', message: 'project scope is not authorized' } } }; return null; }
export function createFindingResponse(input) { const denied = guard(input); if (denied) return denied; try { return { status: 201, body: { data: createFinding({ projectId: input.project.id, agentType: input.agentType ?? 'COST_MONITORING', payload: input.body }), meta: { idempotencyKey: input.idempotencyKey } } }; } catch (error) { return { status: 422, body: { error: { code: 'FINDING_VALIDATION_FAILED', message: error.message } } }; } }
export function reviewFindingResponse(input) { const denied = guard(input); if (denied) return denied; try { return { status: 200, body: { data: reviewFinding({ finding: input.finding, actorType: input.user.role, decision: input.body.decision, reason: input.body.reason }), meta: { idempotencyKey: input.idempotencyKey } } }; } catch (error) { return { status: 422, body: { error: { code: 'FINDING_REVIEW_FAILED', message: error.message } } }; } }
export function validateImportResponse(input) { if (!scope(input)) return { status: 403, body: { error: { code: 'PROJECT_SCOPE_DENIED', message: 'project scope is not authorized' } } }; try { return { status: 200, body: { data: validateImportRows({ projectId: input.project.id, rows: input.body.rows }) } }; } catch (error) { return { status: 422, body: { error: { code: 'IMPORT_VALIDATION_FAILED', message: error.message } } }; } }
export function commitImportResponse(input) {
  if (!input.idempotencyKey?.trim()) return { status: 400, body: { error: { code: 'IDEMPOTENCY_KEY_REQUIRED', message: 'Idempotency-Key is required' } } };
  if (!scope(input)) return { status: 403, body: { error: { code: 'PROJECT_SCOPE_DENIED', message: 'project scope is not authorized' } } };
  if (!['ADMIN', 'PROJECT_MANAGER', 'COST_ENGINEER'].includes(input.user.role)) return { status: 403, body: { error: { code: 'CAPABILITY_DENIED', message: 'role cannot commit imports' } } };
  const result = validateImportRows({ projectId: input.project.id, rows: input.body.rows });
  if (result.errors.length) return { status: 422, body: { error: { code: 'IMPORT_VALIDATION_FAILED', message: 'import contains invalid rows' }, data: result } };
  return { status: 201, body: { data: { importedCount: result.valid.length, rows: result.valid }, meta: { idempotencyKey: input.idempotencyKey } } };
}
