import { BaseAgent } from './base-agent.js';

export class PeriodStalenessAgent extends BaseAgent {
  constructor() {
    super({
      id: 'period-staleness',
      name: 'Period Staleness Agent',
      description: 'Identifies stale accounting periods lacking recent invoice postings or unclosed accruals',
      cadence: 'weekly'
    });
  }

  async evaluate({ projectId, actualCosts = [], accruals = [] }) {
    const findings = [];
    const now = Date.now();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    // Check if latest actual cost posting is older than 30 days
    if (actualCosts.length > 0) {
      const dates = actualCosts
        .map((a) => (a.transaction_date ? new Date(a.transaction_date).getTime() : a.created_at ? new Date(a.created_at).getTime() : 0))
        .filter((t) => t > 0);

      const latestTime = Math.max(...dates, 0);
      if (latestTime > 0 && now - latestTime > thirtyDaysMs) {
        const daysStale = Math.floor((now - latestTime) / (24 * 60 * 60 * 1000));
        findings.push(
          this.createFinding(projectId, {
            title: 'Stale Actual Cost Postings Detected',
            statement: `No actual cost transactions have been recorded in the last ${daysStale} days. Ledgers may be stale.`,
            severity: 'MEDIUM',
            confidence: 0.90,
            evidence: [
              { lastPostingDate: new Date(latestTime).toISOString(), daysStale }
            ]
          })
        );
      }
    }

    // Check for pending unposted accruals
    const pendingAccruals = accruals.filter((a) => a.status === 'pending');
    if (pendingAccruals.length > 0) {
      const pendingTotal = pendingAccruals.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
      findings.push(
        this.createFinding(projectId, {
          title: 'Unposted Period Accruals Requiring Reconciliation',
          statement: `${pendingAccruals.length} pending accrual entries totaling $${pendingTotal.toLocaleString()} require formal posting or reversal.`,
          severity: 'LOW',
          confidence: 0.92,
          evidence: [
            { count: pendingAccruals.length, pendingTotal }
          ]
        })
      );
    }

    return findings;
  }
}
