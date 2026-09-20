import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultAgentRegistry, AgentRegistry } from '../src/agents/registry.js';
import { CostMonitorAgent } from '../src/agents/cost-monitor.js';
import { BudgetVarianceAgent } from '../src/agents/budget-variance.js';
import { CommitmentGapAgent } from '../src/agents/commitment-gap.js';
import { PeriodStalenessAgent } from '../src/agents/period-staleness.js';
import { AnomalyDetectorAgent } from '../src/agents/anomaly-detector.js';
import { SumopodLlmAdvisor } from '../src/agents/llm-advisor.js';

test('AgentRegistry contains all 5 deterministic rule agents', () => {
  const agents = defaultAgentRegistry.list();
  assert.equal(agents.length, 5);
  const ids = agents.map((a) => a.id).sort();
  assert.deepEqual(ids, [
    'anomaly-detector',
    'budget-variance',
    'commitment-gap',
    'cost-monitor',
    'period-staleness'
  ]);
});

test('CostMonitorAgent flags cumulative actuals exceeding BAC', async () => {
  const agent = new CostMonitorAgent();
  const findings = await agent.evaluate({
    projectId: 'p-1',
    actualCosts: [{ actual_amount: 150000 }, { actual_amount: 200000 }],
    evmMetrics: [{ bac: 300000 }]
  });

  assert.equal(findings.length, 1);
  assert.equal(findings[0].severity, 'HIGH');
  assert.match(findings[0].title, /Actuals Exceed Total Sanctioned BAC/);
  assert.equal(findings[0].evidence.length > 0, true);
});

test('BudgetVarianceAgent flags critical CPI degradation (< 0.90)', async () => {
  const agent = new BudgetVarianceAgent();
  const findings = await agent.evaluate({
    projectId: 'p-1',
    evmMetrics: [{ period_id: 'M03', cpi: 0.88, cv: -120000, ev: 880000, ac: 1000000 }]
  });

  assert.equal(findings.length, 1);
  assert.equal(findings[0].severity, 'CRITICAL');
  assert.match(findings[0].statement, /CPI of 0.88/);
});

test('CommitmentGapAgent detects commitments exceeding budget allocation', async () => {
  const agent = new CommitmentGapAgent();
  const findings = await agent.evaluate({
    projectId: 'p-1',
    commitments: [{ wbs_node_id: 'wbs-1', committed_amount: 600000 }],
    budgetLines: [{ wbs_node_id: 'wbs-1', amount: 500000 }]
  });

  assert.equal(findings.length, 1);
  assert.equal(findings[0].severity, 'HIGH');
  assert.match(findings[0].title, /Commitment Overrun on WBS Node/);
});

test('PeriodStalenessAgent detects stale posting dates (> 30 days)', async () => {
  const agent = new PeriodStalenessAgent();
  const fortyDaysAgo = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString();
  const findings = await agent.evaluate({
    projectId: 'p-1',
    actualCosts: [{ actual_amount: 50000, transaction_date: fortyDaysAgo }],
    accruals: [{ amount: 15000, status: 'pending' }]
  });

  assert.equal(findings.length, 2);
  assert.match(findings[0].title, /Stale Actual Cost/);
  assert.match(findings[1].title, /Unposted Period Accruals/);
});

test('AnomalyDetectorAgent flags outlier transactions with high z-score', async () => {
  const agent = new AnomalyDetectorAgent();
  const findings = await agent.evaluate({
    projectId: 'p-1',
    actualCosts: [
      { invoice_reference: 'INV-1', actual_amount: 10000 },
      { invoice_reference: 'INV-2', actual_amount: 12000 },
      { invoice_reference: 'INV-3', actual_amount: 11000 },
      { invoice_reference: 'INV-4', actual_amount: 9500 },
      { invoice_reference: 'INV-5', actual_amount: 10500 },
      { invoice_reference: 'INV-SPIKE', actual_amount: 350000 }
    ]
  });

  assert.equal(findings.length, 1);
  assert.equal(findings[0].severity, 'HIGH');
  assert.match(findings[0].title, /Statistical Outlier Invoice/);
});

test('SumopodLlmAdvisor provides non-mutating advisory in offline mode', async () => {
  const advisor = new SumopodLlmAdvisor({ apiKey: '' });
  const result = await advisor.advise({
    question: 'What is the CPI status?',
    ledgerContext: { evm: { cpi: 0.91, bac: 3500000, eac: 3740000 } }
  });

  assert.ok(result.answer.includes('Sumopod Advisor'));
  assert.ok(result.answer.includes('0.91'));
  assert.equal(result.evidence.offlineSimulated, true);
});
