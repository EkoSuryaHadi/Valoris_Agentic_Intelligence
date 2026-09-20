import { BaseAgent } from './base-agent.js';

export class CostMonitorAgent extends BaseAgent {
  constructor() {
    super({
      id: 'cost-monitor',
      name: 'Cost Monitor Agent',
      description: 'Monitors cumulative actual costs against baseline budget threshold limits',
      cadence: 'continuous'
    });
  }

  async evaluate({ projectId, baselines = [], actualCosts = [], evmMetrics = [] }) {
    const findings = [];
    const totalActual = actualCosts.reduce((acc, c) => acc + (Number(c.actual_amount ?? c.amount) || 0), 0);

    const latestEvm = evmMetrics[0];
    const bac = latestEvm?.bac || baselines.find((b) => b.status === 'APPROVED')?.bac || baselines[0]?.bac || 0;

    if (bac > 0 && totalActual > bac) {
      findings.push(
        this.createFinding(projectId, {
          title: 'Cumulative Actuals Exceed Total Sanctioned BAC',
          statement: `Cumulative posted actual costs ($${totalActual.toLocaleString()}) have breached total Budget at Completion ($${bac.toLocaleString()}).`,
          severity: 'HIGH',
          confidence: 0.98,
          evidence: [
            { totalActual, bac, breachAmount: totalActual - bac, ratio: totalActual / bac }
          ]
        })
      );
    } else if (bac > 0 && totalActual > bac * 0.9) {
      findings.push(
        this.createFinding(projectId, {
          title: 'Actuals Incurred Near Budget Ceiling (90% Threshold)',
          statement: `Cumulative actual costs ($${totalActual.toLocaleString()}) have reached ${(totalActual / bac * 100).toFixed(1)}% of total baseline BAC.`,
          severity: 'MEDIUM',
          confidence: 0.95,
          evidence: [
            { totalActual, bac, percentage: (totalActual / bac * 100) }
          ]
        })
      );
    }

    return findings;
  }
}
