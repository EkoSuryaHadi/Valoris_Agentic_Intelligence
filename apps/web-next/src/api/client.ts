import type { PaginatedResponse, ApiResponse } from '../types/api';
import type { UserContext, ProjectSummary } from '../types/auth';
import type {
  WbsNode,
  CostCode,
  Baseline,
  BudgetLine,
  Commitment,
  ActualCost,
  Accrual,
  Forecast,
  EvmMetrics,
  ChangeOrder,
  CashFlow,
  Risk,
  AgentFinding,
  AuditEvent
} from '../types/domain';

export interface ApiClientConfig {
  baseUrl?: string;
  getUserContext: () => UserContext;
  fetcher?: typeof fetch;
}

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(message: string, status: number, code: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function createApiClient(config: ApiClientConfig) {
  const { baseUrl = '', getUserContext, fetcher = fetch } = config;

  function defaultRequestId() {
    return globalThis.crypto?.randomUUID?.() || `req-${Date.now()}`;
  }

  async function request<T>(
    path: string,
    options: {
      method?: string;
      body?: unknown;
      idempotencyKey?: string;
      params?: Record<string, string | number | undefined>;
    } = {}
  ): Promise<T> {
    const { method = 'GET', body, idempotencyKey, params } = options;
    const user = getUserContext();

    let url = `${baseUrl.replace(/\/$/, '')}${path}`;
    if (params) {
      const search = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) search.set(key, String(value));
      }
      const qs = search.toString();
      if (qs) url += (url.includes('?') ? '&' : '?') + qs;
    }

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'X-Request-Id': defaultRequestId(),
      'x-organization-id': user.organizationId,
      'x-project-id': user.projectId,
      'x-role': user.role,
      'x-user-id': user.userId,
      Authorization: `Bearer mock-token-${user.userId}`
    };

    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }

    const response = await fetcher(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });

    const payload = (await response.json().catch(() => ({}))) as ApiResponse<T>;

    if (!response.ok) {
      const err = payload.error || { code: 'HTTP_ERROR', message: `Request failed with status ${response.status}` };
      throw new ApiError(err.message, response.status, err.code, err.details);
    }

    // Return the envelope directly if paginated ({ data, meta }), or unwrap payload.data
    return payload as unknown as T;
  }

  const pPath = (projectId: string, resource: string) => `/api/v1/projects/${encodeURIComponent(projectId)}/${resource}`;

  return {
    // Projects
    listProjects: (params?: { page?: number; limit?: number }) =>
      request<PaginatedResponse<ProjectSummary>>('/api/v1/projects', { params }),
    getCostSummary: (projectId: string) =>
      request<{ data: any }>(pPath(projectId, 'cost-summary')),

    // WBS
    getWbs: (projectId: string, params?: { page?: number; limit?: number }) =>
      request<PaginatedResponse<WbsNode>>(pPath(projectId, 'wbs'), { params }),
    createWbsNode: (projectId: string, body: Partial<WbsNode>, key?: string) =>
      request<{ data: WbsNode }>(pPath(projectId, 'wbs'), { method: 'POST', body, idempotencyKey: key }),

    // CBS / Cost Codes
    getCostCodes: (projectId: string, params?: { page?: number; limit?: number }) =>
      request<PaginatedResponse<CostCode>>(pPath(projectId, 'cost-codes'), { params }),

    // Baselines
    getBaselines: (projectId: string, params?: { page?: number; limit?: number }) =>
      request<PaginatedResponse<Baseline>>(pPath(projectId, 'baselines'), { params }),
    createBaseline: (projectId: string, body: Partial<Baseline>, key?: string) =>
      request<{ data: Baseline }>(pPath(projectId, 'baselines'), { method: 'POST', body, idempotencyKey: key }),
    createBudgetLine: (baselineId: string, body: Partial<BudgetLine>, key?: string) =>
      request<{ data: BudgetLine }>(`/api/v1/baselines/${encodeURIComponent(baselineId)}/lines`, { method: 'POST', body, idempotencyKey: key }),
    transitionBaseline: (baselineId: string, body: { status: string; actor: string; reason?: string }, key?: string) =>
      request<{ data: Baseline }>(`/api/v1/baselines/${encodeURIComponent(baselineId)}/transition`, { method: 'POST', body, idempotencyKey: key }),

    // Commitments
    getCommitments: (projectId: string, params?: { page?: number; limit?: number }) =>
      request<PaginatedResponse<Commitment>>(pPath(projectId, 'commitments'), { params }),
    createCommitment: (projectId: string, body: Partial<Commitment>, key?: string) =>
      request<{ data: Commitment }>(pPath(projectId, 'commitments'), { method: 'POST', body, idempotencyKey: key }),

    // Actual Costs
    getActualCosts: (projectId: string, params?: { page?: number; limit?: number }) =>
      request<PaginatedResponse<ActualCost>>(pPath(projectId, 'actual-costs'), { params }),
    postActualCost: (periodId: string, body: Partial<ActualCost>, key?: string) =>
      request<{ data: ActualCost }>(`/api/v1/periods/${encodeURIComponent(periodId)}/actual-costs`, { method: 'POST', body, idempotencyKey: key }),

    // Accruals
    getAccruals: (projectId: string, params?: { page?: number; limit?: number }) =>
      request<PaginatedResponse<Accrual>>(pPath(projectId, 'accruals'), { params }),
    createAccrual: (periodId: string, body: Partial<Accrual>, key?: string) =>
      request<{ data: Accrual }>(`/api/v1/periods/${encodeURIComponent(periodId)}/accruals`, { method: 'POST', body, idempotencyKey: key }),

    // Forecasts
    getForecasts: (projectId: string, params?: { page?: number; limit?: number }) =>
      request<PaginatedResponse<Forecast>>(pPath(projectId, 'forecasts'), { params }),
    calculateForecast: (periodId: string, body: { method: string; etcAmount?: number; rationale?: string }, key?: string) =>
      request<{ data: Forecast }>(`/api/v1/periods/${encodeURIComponent(periodId)}/forecast`, { method: 'POST', body, idempotencyKey: key }),

    // EVM
    getEvm: (projectId: string, params?: { page?: number; limit?: number }) =>
      request<PaginatedResponse<EvmMetrics>>(pPath(projectId, 'evm-snapshots'), { params }).catch(() =>
        request<PaginatedResponse<EvmMetrics>>(pPath(projectId, 'evm'), { params })
      ),
    calculateEvm: (periodId: string, body: Record<string, unknown>, key?: string) =>
      request<{ data: EvmMetrics }>(`/api/v1/periods/${encodeURIComponent(periodId)}/evm`, { method: 'POST', body, idempotencyKey: key }),

    // Changes
    getChanges: (projectId: string, params?: { page?: number; limit?: number }) =>
      request<PaginatedResponse<ChangeOrder>>(pPath(projectId, 'changes'), { params }),
    createChange: (projectId: string, body: Partial<ChangeOrder>, key?: string) =>
      request<{ data: ChangeOrder }>(pPath(projectId, 'changes'), { method: 'POST', body, idempotencyKey: key }),
    incorporateChange: (changeId: string, key?: string) =>
      request<{ data: ChangeOrder }>(`/api/v1/changes/${encodeURIComponent(changeId)}/incorporate`, { method: 'POST', body: {}, idempotencyKey: key }),

    // Cash Flows
    getCashFlows: (projectId: string, params?: { page?: number; limit?: number }) =>
      request<PaginatedResponse<CashFlow>>(pPath(projectId, 'cash-flow'), { params }).catch(() =>
        request<PaginatedResponse<CashFlow>>(pPath(projectId, 'cash-flows'), { params })
      ),
    postCashFlow: (projectId: string, body: Record<string, unknown>) =>
      request<{ data: CashFlow }>(`/api/v1/projects/${encodeURIComponent(projectId)}/cash-flow`, { method: 'POST', body }),

    // Risks
    getRisks: (projectId: string, params?: { page?: number; limit?: number }) =>
      request<PaginatedResponse<Risk>>(pPath(projectId, 'risks'), { params }),
    createRisk: (projectId: string, body: Partial<Risk>, key?: string) =>
      request<{ data: Risk }>(pPath(projectId, 'risks'), { method: 'POST', body, idempotencyKey: key }),

    // Agent Findings & Review
    getAgentFindings: (projectId: string, params?: { page?: number; limit?: number }) =>
      request<PaginatedResponse<AgentFinding>>(pPath(projectId, 'agent-findings'), { params }),
    createFinding: (projectId: string, body: Partial<AgentFinding>, key?: string) =>
      request<{ data: AgentFinding }>(pPath(projectId, 'agent-findings'), { method: 'POST', body, idempotencyKey: key }),
    reviewFinding: (findingId: string, body: { status: 'accepted' | 'dismissed'; notes?: string }, key?: string) =>
      request<{ data: AgentFinding }>(`/api/v1/agent-findings/${encodeURIComponent(findingId)}/review`, { method: 'POST', body, idempotencyKey: key }),

    // Audit Events
    getAuditEvents: (projectId: string, params?: { page?: number; limit?: number }) =>
      request<PaginatedResponse<AuditEvent>>(pPath(projectId, 'audit-events'), { params }),

    // Data Imports
    previewImport: (projectId: string, body: { importType: string; records: unknown[] }) =>
      request<{ data: unknown }>(`/api/v1/projects/${encodeURIComponent(projectId)}/imports/preview`, { method: 'POST', body }),
    commitImport: (projectId: string, body: { importId: string }, key?: string) =>
      request<{ data: unknown }>(`/api/v1/projects/${encodeURIComponent(projectId)}/imports/commit`, { method: 'POST', body, idempotencyKey: key }),

    // Agent Execution & Sumopod Advisory
    runAgent: (projectId: string, agentName: string) =>
      request<{ data: unknown }>(`/api/v1/projects/${encodeURIComponent(projectId)}/agents/${encodeURIComponent(agentName)}/run`, { method: 'POST', body: {} }),
    askAdvisor: (projectId: string, question: string) =>
      request<{ data: { answer: string; evidence: Record<string, unknown> } }>(`/api/v1/projects/${encodeURIComponent(projectId)}/advisor`, { method: 'POST', body: { question } })
  };
}
