import { BaseAgent } from './base-agent.js';

export class BudgetVarianceAgent extends BaseAgent {
  constructor() {
    super({
      id: 'budget-variance',
      name: 'Budget Variance Agent',
      description: 'Identifies negative cost variance (CV < 0) and unfavorable CPI degradation',
      cadence: 'hourly'
    });
  }

  async evaluate({ projectId, evmMetrics = [] }) {
    const findings = [];
    if (!evmMetrics || evmMetrics.length === 0) return findings;

    for (const metric of evmMetrics) {
      const cpi = Number(metric.cpi) || 1.0;
      const cv = Number(metric.cv) || 0;

      if (cpi < 0.90 || cv < -100000) {
        findings.push(
          this.createFinding(projectId, {
            title: 'Critical Cost Performance Degradation (CPI < 0.90)',
            statement: `Period ${metric.period_id || 'current'} exhibits critical cost inefficiency with CPI of ${cpi.toFixed(2)} and Cost Variance of -$${Math.abs(cv).toLocaleString()}.`,
            severity: 'CRITICAL',
            confidence: 0.99,
            evidence: [
              { periodId: metric.period_id, cpi, cv, ev: metric.ev, ac: metric.ac }
            ]
          })
        );
      } else if (cpi < 0.95 || cv < -25000) {
        findings.push(
          this.createFinding(projectId, {
            title: 'Unfavorable Cost Variance Alert (CPI < 0.95)',
            statement: `Cost Performance Index has degraded to ${cpi.toFixed(2)} with negative cost variance -$${Math.abs(cv).toLocaleString()}.`,
            severity: 'HIGH',
            confidence: 0.95,
            evidence: [
              { periodId: metric.period_id, cpi, cv, ev: metric.ev, ac: metric.ac }
            ]
          })
        );
      }
    }

    return findings;
  }
}
