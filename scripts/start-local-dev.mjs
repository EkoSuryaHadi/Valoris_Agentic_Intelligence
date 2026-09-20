import { createApiServer } from '../packages/api/src/server.js';

const projectId = 'project-demo';
const organizationId = 'org-default';

const projectStore = [
  { id: projectId, organizationId, code: 'PRJ-ALPHA', name: 'Industrial Infrastructure Expansion', currency: 'USD', status: 'ACTIVE' }
];

const costCodeStore = [
  { id: 'cc-1', projectId, code: '01-001', name: 'Civil & Substructure Works' },
  { id: 'cc-2', projectId, code: '02-001', name: 'Structural Steel Fabrication' },
  { id: 'cc-3', projectId, code: '03-001', name: 'Mechanical & Piping Installation' }
];

const periodStore = [
  { id: 'per-1', projectId, name: 'M01 - January 2026', status: 'OPEN' },
  { id: 'per-2', projectId, name: 'M02 - February 2026', status: 'OPEN' },
  { id: 'per-3', projectId, name: 'M03 - March 2026', status: 'OPEN' }
];

const baselineStore = [
  { id: 'base-1', projectId, version: 1, name: 'Sanctioned Master Budget v1', status: 'APPROVED', bac: 3500000 }
];

const wbsStore = [
  { id: 'wbs-1', projectId, code: 'WBS.1', name: 'Phase 1: Civil Substructure', level: 1 },
  { id: 'wbs-2', projectId, parentId: 'wbs-1', code: 'WBS.1.1', name: 'Deep Foundation Piling', level: 2 },
  { id: 'wbs-3', projectId, code: 'WBS.2', name: 'Phase 2: Superstructure Assembly', level: 1 }
];

const budgetLineStore = [
  { id: 'bl-1', baselineId: 'base-1', wbsId: 'wbs-1', costCodeId: 'cc-1', amount: 1500000 },
  { id: 'bl-2', baselineId: 'base-1', wbsId: 'wbs-2', costCodeId: 'cc-2', amount: 2000000 }
];

const commitmentStore = [
  { id: 'c-1', projectId, referenceNo: 'PO-2026-001', vendor: 'Apex Fabrication Corp', amount: 850000, status: 'OPEN' },
  { id: 'c-2', projectId, referenceNo: 'PO-2026-002', vendor: 'Terra Geotech Ltd', amount: 450000, status: 'OPEN' }
];

const actualStore = [
  { id: 'a-1', projectId, periodId: 'per-1', sourceRef: 'INV-APEX-01', amount: 420000, status: 'POSTED' },
  { id: 'a-2', projectId, periodId: 'per-1', sourceRef: 'INV-TERRA-01', amount: 210000, status: 'POSTED' }
];

const accrualStore = [
  { id: 'acc-1', projectId, periodId: 'per-1', sourceRef: 'ACC-JAN-EQUIP', amount: 75000, status: 'POSTED' }
];

const forecastStore = [
  { id: 'f-1', projectId, periodId: 'per-1', method: 'cpi', actualCost: 630000, etc: 2940000, eac: 3570000, vac: -70000 }
];

const evmStore = [
  { id: 'evm-1', projectId, periodId: 'per-1', bac: 3500000, pv: 650000, ev: 615000, ac: 630000, cpi: 0.976, spi: 0.946, cv: -15000, sv: -35000 }
];

const changeStore = [
  { id: 'chg-1', projectId, title: 'Subsurface Piling Reinforcement', estimatedCost: 120000, status: 'PROPOSED', description: 'Encountered unexpected soil bedrock' }
];

const riskStore = [
  { id: 'r-1', projectId, description: 'Steel Tariff Escalation', probability: 0.4, impactAmount: 200000, weightedExposure: 80000, severity: 'MEDIUM', status: 'OPEN' }
];

const findingStore = [
  { id: 'fnd-1', projectId, agentName: 'CostMonitorAgent', severity: 'WARNING', title: 'Actual burn approaching baseline milestone', rationale: 'Actual costs ($630k) are trending near period threshold.', status: 'NEW' }
];

const cashFlowStore = [];
const auditStore = [
  { id: 'aud-1', organizationId, projectId, action: 'BASELINE_APPROVED', actorUserId: 'usr-admin-01', timestamp: new Date().toISOString(), reason: 'Initial project baseline sanctioned' }
];

const server = createApiServer({
  projectStore,
  wbsStore,
  baselineStore,
  costCodeStore,
  budgetLineStore,
  commitmentStore,
  actualStore,
  accrualStore,
  forecastStore,
  evmStore,
  changeStore,
  riskStore,
  findingStore,
  cashFlowStore,
  auditStore,
  periodStore,
  allowInsecureDevHeaders: true
});

const PORT = 4000;
server.listen(PORT, '127.0.0.1', () => {
  console.log(`Valoris API Backend listening on http://127.0.0.1:${PORT}`);
});
