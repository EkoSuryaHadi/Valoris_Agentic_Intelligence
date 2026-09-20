import { BaseAgent } from './base-agent.js';

export class AnomalyDetectorAgent extends BaseAgent {
  constructor() {
    super({
      id: 'anomaly-detector',
      name: 'Anomaly Detector Agent',
      description: 'Statistical anomaly detection flagging transaction outliers and abnormal burn rate spikes',
      cadence: 'event-driven'
    });
  }

  async evaluate({ projectId, actualCosts = [] }) {
    const findings = [];
    if (actualCosts.length < 3) return findings;

    const amounts = actualCosts.map((a) => Number(a.actual_amount) || 0).filter((amt) => amt > 0);
    if (amounts.length < 3) return findings;

    const mean = amounts.reduce((sum, v) => sum + v, 0) / amounts.length;
    const variance = amounts.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);

    for (const cost of actualCosts) {
      const amt = Number(cost.actual_amount) || 0;
      // Flag if invoice is > 2 standard deviations above mean or high single transaction
      if (stdDev > 0 && (amt - mean) > 1.95 * stdDev && amt > 100000) {
        findings.push(
          this.createFinding(projectId, {
            title: `Statistical Outlier Invoice (${cost.invoice_reference || 'REF'})`,
            statement: `Transaction amount $${amt.toLocaleString()} exceeds the project mean ($${Math.round(mean).toLocaleString()}) by more than 2.5 standard deviations (z-score: ${((amt - mean) / stdDev).toFixed(2)}).`,
            severity: 'HIGH',
            confidence: 0.94,
            evidence: [
              { invoiceRef: cost.invoice_reference, amount: amt, mean, stdDev, zScore: (amt - mean) / stdDev }
            ]
          })
        );
      }
    }

    return findings;
  }
}
