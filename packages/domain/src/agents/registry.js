import { CostMonitorAgent } from './cost-monitor.js';
import { BudgetVarianceAgent } from './budget-variance.js';
import { CommitmentGapAgent } from './commitment-gap.js';
import { PeriodStalenessAgent } from './period-staleness.js';
import { AnomalyDetectorAgent } from './anomaly-detector.js';

export class AgentRegistry {
  constructor() {
    this.agents = new Map();
    this.register(new CostMonitorAgent());
    this.register(new BudgetVarianceAgent());
    this.register(new CommitmentGapAgent());
    this.register(new PeriodStalenessAgent());
    this.register(new AnomalyDetectorAgent());
  }

  register(agent) {
    this.agents.set(agent.id, agent);
  }

  get(agentId) {
    return this.agents.get(agentId);
  }

  list() {
    return Array.from(this.agents.values());
  }

  async runAgent(agentId, context) {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error(`Agent ${agentId} not found in registry`);
    return await agent.evaluate(context);
  }

  async runAll(context) {
    const allFindings = [];
    for (const agent of this.agents.values()) {
      try {
        const findings = await agent.evaluate(context);
        allFindings.push(...findings);
      } catch (err) {
        console.error(`Error running agent ${agent.id}:`, err);
      }
    }
    return allFindings;
  }
}

export const defaultAgentRegistry = new AgentRegistry();
