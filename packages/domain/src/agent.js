export function createFinding({ projectId, agentType, payload }) {
  if (!projectId?.trim() || !agentType?.trim()) throw new Error('project and agent type are required');
  if (!payload.title?.trim() || !payload.statement?.trim()) throw new Error('finding title and statement are required');
  if (!Number.isFinite(payload.confidence) || payload.confidence < 0 || payload.confidence > 1) throw new Error('confidence must be between 0 and 1');
  if (!Array.isArray(payload.evidence) || payload.evidence.length === 0) throw new Error('evidence is required');
  return { projectId, agentType, title: payload.title.trim(), statement: payload.statement.trim(), severity: payload.severity ?? 'MEDIUM', confidence: payload.confidence, evidence: payload.evidence, status: 'NEW' };
}

export function reviewFinding({ finding, actorType, decision, reason }) {
  if (actorType === 'AGENT') throw new Error('human review is required');
  if (!['ACCEPTED', 'DISMISSED', 'ESCALATED'].includes(decision)) throw new Error('invalid finding decision');
  if (!reason?.trim()) throw new Error('review reason is required');
  return { status: decision, reviewedBy: actorType, reason: reason.trim() };
}
