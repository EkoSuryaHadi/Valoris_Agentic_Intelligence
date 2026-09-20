import { BaseAgent } from './base-agent.js';

export class CommitmentGapAgent extends BaseAgent {
  constructor() {
    super({
      id: 'commitment-gap',
      name: 'Commitment Gap Agent',
      description: 'Detects commitments exceeding control account budget allocations or unhedged exposure',
      cadence: 'daily'
    });
  }

  async evaluate({ projectId, commitments = [], budgetLines = [] }) {
    const findings = [];
    const commitmentByWbs = new Map();

    for (const comm of commitments) {
      const wbsId = comm.wbs_node_id || 'unassigned';
      const prev = commitmentByWbs.get(wbsId) || 0;
      commitmentByWbs.set(wbsId, prev + (Number(comm.committed_amount) || 0));
    }

    const budgetByWbs = new Map();
    for (const bl of budgetLines) {
      const wbsId = bl.wbs_node_id;
      const prev = budgetByWbs.get(wbsId) || 0;
      budgetByWbs.set(wbsId, prev + (Number(bl.amount) || 0));
    }

    for (const [wbsId, totalCommitted] of commitmentByWbs.entries()) {
      const allocatedBudget = budgetByWbs.get(wbsId) || 0;
      if (allocatedBudget > 0 && totalCommitted > allocatedBudget) {
        const gap = totalCommitted - allocatedBudget;
        findings.push(
          this.createFinding(projectId, {
            title: `Commitment Overrun on WBS Node ${wbsId}`,
            statement: `Total purchase commitments ($${totalCommitted.toLocaleString()}) exceed approved budget allocation ($${allocatedBudget.toLocaleString()}) by $${gap.toLocaleString()}.`,
            severity: 'HIGH',
            confidence: 0.96,
            evidence: [
              { wbsNodeId: wbsId, totalCommitted, allocatedBudget, gap }
            ]
          })
        );
      }
    }

    return findings;
  }
}
