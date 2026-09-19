function defaultRequestId() {
  return globalThis.crypto?.randomUUID?.() || `req-${Date.now()}`;
}

export function createApiClient({ baseUrl = '', tokenProvider = () => '', requestId = defaultRequestId, fetcher = fetch } = {}) {
  async function request(path, { method = 'GET', body, idempotencyKey } = {}) {
    const headers = { Accept: 'application/json', 'X-Request-Id': requestId() };
    const token = tokenProvider();
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
    const response = await fetcher(`${baseUrl.replace(/\/$/, '')}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(payload.error?.message || 'API request failed');
      error.status = response.status;
      error.code = payload.error?.code || 'API_REQUEST_FAILED';
      throw error;
    }
    return payload.data ?? payload;
  }

  const projectPath = (projectId, resource) => `/projects/${encodeURIComponent(projectId)}/${resource}`;
  return {
    listProjects: () => request('/projects'),
    getWbs: (projectId) => request(projectPath(projectId, 'wbs')),
    createWbsNode: (projectId, body, idempotencyKey) => request(projectPath(projectId, 'wbs'), { method: 'POST', body, idempotencyKey }),
    getBaselines: (projectId) => request(projectPath(projectId, 'baselines')),
    createBaseline: (projectId, body, idempotencyKey) => request(projectPath(projectId, 'baselines'), { method: 'POST', body, idempotencyKey }),
    createBudgetLine: (baselineId, body, idempotencyKey) => request(`/baselines/${encodeURIComponent(baselineId)}/lines`, { method: 'POST', body, idempotencyKey }),
    transitionBaseline: (baselineId, body, idempotencyKey) => request(`/baselines/${encodeURIComponent(baselineId)}/transition`, { method: 'POST', body, idempotencyKey }),
    createCommitment: (projectId, body, idempotencyKey) => request(`/projects/${encodeURIComponent(projectId)}/commitments`, { method: 'POST', body, idempotencyKey }),
    postActualCost: (periodId, body, idempotencyKey) => request(`/periods/${encodeURIComponent(periodId)}/actual-costs`, { method: 'POST', body, idempotencyKey }),
    createAccrual: (periodId, body, idempotencyKey) => request(`/periods/${encodeURIComponent(periodId)}/accruals`, { method: 'POST', body, idempotencyKey }),
    previewImport: (projectId, body) => request(`/projects/${encodeURIComponent(projectId)}/imports/preview`, { method: 'POST', body }),
    commitImport: (projectId, body, idempotencyKey) => request(`/projects/${encodeURIComponent(projectId)}/imports/commit`, { method: 'POST', body, idempotencyKey })
  };
}
