import { createFinding } from '../agent.js';

export class BaseAgent {
  constructor({ id, name, description, cadence = 'continuous' }) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.cadence = cadence;
  }

  /**
   * Run agent evaluation against project ledger data.
   * @param {Object} context
   * @param {string} context.projectId
   * @param {Array} [context.baselines]
   * @param {Array} [context.commitments]
   * @param {Array} [context.actualCosts]
   * @param {Array} [context.forecasts]
   * @param {Array} [context.evmMetrics]
   * @param {Array} [context.periods]
   * @returns {Promise<Array>} List of findings created
   */
  async evaluate(context) {
    throw new Error('evaluate() must be implemented by subclass');
  }

  /**
   * Helper to format finding using domain validation
   */
  createFinding(projectId, payload) {
    return createFinding({
      projectId,
      agentType: this.id,
      payload: {
        title: payload.title,
        statement: payload.statement || payload.explanation,
        severity: payload.severity || 'MEDIUM',
        confidence: payload.confidence ?? 0.9,
        evidence: Array.isArray(payload.evidence) ? payload.evidence : [payload.evidence || {}]
      }
    });
  }
}
