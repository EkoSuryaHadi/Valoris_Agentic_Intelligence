import { createProjectResponse } from './projects.js';
import { createHierarchyResponse } from './hierarchy.js';
import { createBaselineResponse, createBudgetLineResponse, transitionBaselineResponse } from './baseline.js';
import { validateImportResponse, commitImportResponse, createFindingResponse, reviewFindingResponse } from './agent-import.js';
import { createCommitmentResponse, postActualResponse, createAccrualResponse } from './transactions.js';
import { calculateForecastResponse } from './forecast.js';
import { calculateEvmResponse } from './evm.js';
import { createChangeResponse, incorporateChangeResponse } from './change.js';
import { cashSummaryResponse, createRiskResponse } from './risk-cash.js';
import { buildExecutiveSummary } from '../../domain/src/reporting.js';
import { defaultAgentRegistry } from '../../domain/src/agents/registry.js';
import { SumopodLlmAdvisor } from '../../domain/src/agents/llm-advisor.js';
import { sendJson } from './middleware.js';

function paginateItems(items, requestUrl) {
  const url = new URL(requestUrl, 'http://localhost');
  const pageParam = url.searchParams.get('page');
  const limitParam = url.searchParams.get('limit');
  const page = Math.max(1, parseInt(pageParam, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(limitParam, 10) || 50));
  const offset = (page - 1) * limit;
  const total = items.length;
  const data = items.slice(offset, offset + limit);
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1
    }
  };
}

function checkProjectScope(ctx) {
  if (ctx.user.projectId !== ctx.params.projectId) {
    sendJson(ctx, 403, { error: { code: 'PROJECT_SCOPE_DENIED', message: 'project scope is not authorized' } });
    return false;
  }
  return true;
}

export function registerRoutes(router, { stores, persistence, eventBus, auth, rateLimit, parseBody }) {
  const secureWrite = [rateLimit, parseBody, auth];

  // Health checks
  router.get(['/health', '/api/health'], (ctx) => {
    sendJson(ctx, 200, { status: 'ok' });
  });

  router.get(['/health/deep', '/api/health/deep'], async (ctx) => {
    let dbStatus = 'connected';
    if (persistence?.query) {
      try {
        await persistence.query('SELECT 1');
      } catch (err) {
        dbStatus = 'unhealthy: ' + err.message;
      }
    } else if (persistence?.project) {
      dbStatus = 'persistence_configured';
    } else {
      dbStatus = 'in_memory_ready';
    }

    const memory = process.memoryUsage();
    const uptimeSec = typeof process.uptime === 'function' ? Math.round(process.uptime()) : 0;
    const storeCounts = Object.fromEntries(
      Object.entries(stores || {}).map(([key, store]) => [key, Array.isArray(store) ? store.length : 0])
    );

    const isHealthy = !dbStatus.startsWith('unhealthy');
    sendJson(ctx, isHealthy ? 200 : 503, {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptimeSec,
      database: dbStatus,
      memory: {
        rssMb: Math.round(memory.rss / (1024 * 1024)),
        heapTotalMb: Math.round(memory.heapTotal / (1024 * 1024)),
        heapUsedMb: Math.round(memory.heapUsed / (1024 * 1024))
      },
      stores: storeCounts
    });
  });

  // Basic Read endpoints
  router.get('/api/v1/projects', auth, (ctx) => {
    const data = stores.projectStore.filter((p) => p.organizationId === ctx.user.organizationId);
    sendJson(ctx, 200, { data });
  });

  router.get('/api/v1/projects/:projectId/wbs', auth, (ctx) => {
    if (!checkProjectScope(ctx)) return;
    const data = stores.wbsStore.filter((node) => node.projectId === ctx.params.projectId);
    sendJson(ctx, 200, { data });
  });

  router.get('/api/v1/projects/:projectId/baselines', auth, (ctx) => {
    if (!checkProjectScope(ctx)) return;
    const data = stores.baselineStore.filter((b) => b.projectId === ctx.params.projectId);
    sendJson(ctx, 200, { data });
  });

  // 13 Complete Project Read Endpoints with Pagination
  router.get('/api/v1/projects/:projectId/cost-codes', auth, (ctx) => {
    if (!checkProjectScope(ctx)) return;
    const items = stores.costCodeStore.filter((c) => c.projectId === ctx.params.projectId);
    sendJson(ctx, 200, paginateItems(items, ctx.request.url));
  });

  router.get('/api/v1/projects/:projectId/periods', auth, (ctx) => {
    if (!checkProjectScope(ctx)) return;
    const items = stores.periodStore.filter((p) => p.projectId === ctx.params.projectId);
    sendJson(ctx, 200, paginateItems(items, ctx.request.url));
  });

  router.get('/api/v1/projects/:projectId/commitments', auth, (ctx) => {
    if (!checkProjectScope(ctx)) return;
    const items = stores.commitmentStore.filter((c) => c.projectId === ctx.params.projectId);
    sendJson(ctx, 200, paginateItems(items, ctx.request.url));
  });

  router.get('/api/v1/projects/:projectId/actual-costs', auth, (ctx) => {
    if (!checkProjectScope(ctx)) return;
    const items = stores.actualStore.filter((a) => a.projectId === ctx.params.projectId);
    sendJson(ctx, 200, paginateItems(items, ctx.request.url));
  });

  router.get('/api/v1/projects/:projectId/accruals', auth, (ctx) => {
    if (!checkProjectScope(ctx)) return;
    const items = stores.accrualStore.filter((a) => a.projectId === ctx.params.projectId);
    sendJson(ctx, 200, paginateItems(items, ctx.request.url));
  });

  router.get('/api/v1/projects/:projectId/forecasts', auth, (ctx) => {
    if (!checkProjectScope(ctx)) return;
    const items = stores.forecastStore.filter((f) => f.projectId === ctx.params.projectId);
    sendJson(ctx, 200, paginateItems(items, ctx.request.url));
  });

  router.get(['/api/v1/projects/:projectId/evm', '/api/v1/projects/:projectId/evm-snapshots'], auth, (ctx) => {
    if (!checkProjectScope(ctx)) return;
    const items = stores.evmStore.filter((e) => e.projectId === ctx.params.projectId);
    sendJson(ctx, 200, paginateItems(items, ctx.request.url));
  });

  router.get('/api/v1/projects/:projectId/changes', auth, (ctx) => {
    if (!checkProjectScope(ctx)) return;
    const items = stores.changeStore.filter((c) => c.projectId === ctx.params.projectId);
    sendJson(ctx, 200, paginateItems(items, ctx.request.url));
  });

  router.get('/api/v1/projects/:projectId/risks', auth, (ctx) => {
    if (!checkProjectScope(ctx)) return;
    const items = stores.riskStore.filter((r) => r.projectId === ctx.params.projectId);
    sendJson(ctx, 200, paginateItems(items, ctx.request.url));
  });

  router.get('/api/v1/projects/:projectId/agent-findings', auth, (ctx) => {
    if (!checkProjectScope(ctx)) return;
    const items = stores.findingStore.filter((f) => f.projectId === ctx.params.projectId);
    sendJson(ctx, 200, paginateItems(items, ctx.request.url));
  });

  router.get(['/api/v1/projects/:projectId/cash-flow', '/api/v1/projects/:projectId/cash-flows'], auth, (ctx) => {
    if (!checkProjectScope(ctx)) return;
    const items = stores.cashFlowStore.filter((c) => c.projectId === ctx.params.projectId);
    sendJson(ctx, 200, paginateItems(items, ctx.request.url));
  });

  router.get('/api/v1/projects/:projectId/audit-events', auth, (ctx) => {
    if (!checkProjectScope(ctx)) return;
    const items = stores.auditStore.filter((a) => a.projectId === ctx.params.projectId);
    sendJson(ctx, 200, paginateItems(items, ctx.request.url));
  });

  router.get('/api/v1/projects/:projectId/cost-summary', auth, (ctx) => {
    if (!checkProjectScope(ctx)) return;
    const project = stores.projectStore.find((p) => p.id === ctx.params.projectId);
    if (!project) {
      return sendJson(ctx, 404, { error: { code: 'NOT_FOUND', message: 'project not found' } });
    }

    const projectBaselines = stores.baselineStore.filter((b) => b.projectId === project.id);
    const latestBaseline = projectBaselines.find((b) => b.status === 'APPROVED' || b.status === 'LOCKED') || projectBaselines[0];
    const bac = Number(latestBaseline?.bac || 0);

    const approvedChanges = stores.changeStore
      .filter((c) => c.projectId === project.id && (c.status === 'APPROVED' || c.status === 'INCORPORATED'))
      .reduce((sum, c) => sum + Number(c.approvedCost || c.estimatedCost || 0), 0);

    const commitments = stores.commitmentStore
      .filter((c) => c.projectId === project.id)
      .reduce((sum, c) => sum + Number(c.committedAmount || c.amount || 0), 0);

    const actualCost = stores.actualStore
      .filter((a) => a.projectId === project.id)
      .reduce((sum, a) => sum + Number(a.amount || 0), 0);

    const projectForecasts = stores.forecastStore.filter((f) => f.projectId === project.id);
    const latestForecast = projectForecasts[projectForecasts.length - 1];
    const etc = Number(latestForecast?.etc != null ? latestForecast.etc : (bac > actualCost ? bac - actualCost : 0));

    const riskExposure = stores.riskStore
      .filter((r) => r.projectId === project.id && r.status !== 'CLOSED')
      .reduce((sum, r) => sum + Number(r.exposure || 0), 0);

    const projectEvms = stores.evmStore.filter((e) => e.projectId === project.id);
    const latestEvm = projectEvms[projectEvms.length - 1];
    const cpi = latestEvm?.cpi != null ? Number(latestEvm.cpi) : (actualCost > 0 && bac > 0 ? (bac * 0.5) / actualCost : 1.0);
    const spi = latestEvm?.spi != null ? Number(latestEvm.spi) : 1.0;

    const summary = buildExecutiveSummary({
      bac,
      approvedChanges,
      commitments,
      actualCost,
      etc,
      riskExposure,
      cpi,
      spi
    });

    sendJson(ctx, 200, { data: summary, meta: { readOnly: true, projectId: project.id } });
  });

  // Real-time Server-Sent Events (SSE) Stream
  router.get('/api/v1/projects/:projectId/events', auth, (ctx) => {
    if (!checkProjectScope(ctx)) return;
    const project = stores.projectStore.find((p) => p.id === ctx.params.projectId);
    if (!project) {
      return sendJson(ctx, 404, { error: { code: 'NOT_FOUND', message: 'project not found' } });
    }

    ctx.response.setHeader('content-type', 'text/event-stream');
    ctx.response.setHeader('cache-control', 'no-cache, no-transform');
    ctx.response.setHeader('connection', 'keep-alive');
    ctx.response.setHeader('x-accel-buffering', 'no');
    ctx.response.writeHead(200);

    const initialEvent = {
      status: 'connected',
      projectId: ctx.params.projectId,
      timestamp: new Date().toISOString()
    };
    ctx.response.write(`event: connected\ndata: ${JSON.stringify(initialEvent)}\n\n`);

    const bus = eventBus || ctx.eventBus;
    let unsubscribe = () => {};
    if (bus) {
      unsubscribe = bus.subscribe(ctx.params.projectId, (event) => {
        if (!ctx.response.writableEnded) {
          ctx.response.write(`event: ${event.type || 'message'}\ndata: ${JSON.stringify(event)}\n\n`);
        }
      });
    }

    ctx.request.on('close', () => {
      unsubscribe();
    });
  });

  // Write endpoints
  router.post('/api/v1/projects', ...secureWrite, async (ctx) => {
    const result = createProjectResponse({ user: ctx.user, existingProjects: stores.projectStore, body: ctx.body, idempotencyKey: ctx.idempotencyKey });
    if (result.status === 201) {
      result.body.data = { id: crypto.randomUUID(), ...result.body.data };
      if (persistence.project?.create) await persistence.project.create(result.body.data);
      stores.projectStore.push(result.body.data);
    }
    sendJson(ctx, result.status, result.body);
  });

  router.post('/api/v1/projects/:projectId/wbs', ...secureWrite, async (ctx) => {
    const project = stores.projectStore.find((c) => c.id === ctx.params.projectId);
    const result = createHierarchyResponse({ user: ctx.user, project, existingNodes: stores.wbsStore.filter((n) => n.projectId === ctx.params.projectId), body: ctx.body, idempotencyKey: ctx.idempotencyKey });
    if (result.status === 201) {
      result.body.data = { id: crypto.randomUUID(), ...result.body.data };
      if (persistence.hierarchy?.create) await persistence.hierarchy.create(result.body.data);
      stores.wbsStore.push(result.body.data);
    }
    sendJson(ctx, result.status, result.body);
  });

  router.post('/api/v1/projects/:projectId/baselines', ...secureWrite, async (ctx) => {
    const project = stores.projectStore.find((c) => c.id === ctx.params.projectId);
    const result = createBaselineResponse({ user: ctx.user, project, existingBaselines: stores.baselineStore.filter((b) => b.projectId === ctx.params.projectId), idempotencyKey: ctx.idempotencyKey });
    if (result.status === 201) {
      result.body.data = { id: crypto.randomUUID(), ...result.body.data };
      if (persistence.baseline?.create) await persistence.baseline.create(result.body.data);
      stores.baselineStore.push(result.body.data);
    }
    sendJson(ctx, result.status, result.body);
  });

  router.post('/api/v1/baselines/:baselineId/lines', ...secureWrite, async (ctx) => {
    const baseline = stores.baselineStore.find((c) => c.id === ctx.params.baselineId);
    const project = stores.projectStore.find((c) => c.id === baseline?.projectId);
    const result = createBudgetLineResponse({ user: ctx.user, project, baseline, wbs: stores.wbsStore.find((n) => n.id === ctx.body.wbsId), costCode: stores.costCodeStore.find((c) => c.id === ctx.body.costCodeId), amount: ctx.body.amount, idempotencyKey: ctx.idempotencyKey });
    if (result.status === 201) {
      result.body.data = { id: crypto.randomUUID(), ...result.body.data };
      if (persistence.baseline?.addLine) await persistence.baseline.addLine(result.body.data);
      stores.budgetLineStore.push(result.body.data);
    }
    sendJson(ctx, result.status, result.body);
  });

  router.post(['/api/v1/baselines/:baselineId/transition', '/api/v1/baselines/:baselineId/approve'], ...secureWrite, async (ctx) => {
    if (!ctx.body.reason?.trim()) {
      return sendJson(ctx, 400, { error: { code: 'AUDIT_REASON_REQUIRED', message: 'audit reason is required' } });
    }
    const baseline = stores.baselineStore.find((c) => c.id === ctx.params.baselineId);
    const project = stores.projectStore.find((c) => c.id === baseline?.projectId);
    const result = transitionBaselineResponse({ user: ctx.user, project, baseline, nextStatus: ctx.body.nextStatus, idempotencyKey: ctx.idempotencyKey });
    if (result.status === 200) {
      const previousStatus = baseline.status;
      baseline.status = result.body.data.status;
      result.body.meta.reason = ctx.body.reason.trim();
      if (persistence.baseline?.transition) await persistence.baseline.transition({ id: baseline.id, status: baseline.status });
      if (persistence.audit?.record) await persistence.audit.record({ organizationId: ctx.user.organizationId, projectId: project.id, actorUserId: ctx.user.userId, actorType: 'USER', action: 'BASELINE_TRANSITIONED', entityType: 'BASELINE', entityId: baseline.id, oldValue: { status: previousStatus }, newValue: { status: baseline.status }, reason: ctx.body.reason.trim() });
      if (project?.id) {
        (eventBus || ctx.eventBus)?.publish(project.id, {
          type: 'BASELINE_TRANSITIONED',
          baselineId: baseline.id,
          status: baseline.status
        });
      }
    }
    sendJson(ctx, result.status, result.body);
  });

  router.post('/api/v1/projects/:projectId/imports/preview', ...secureWrite, async (ctx) => {
    const project = stores.projectStore.find((c) => c.id === ctx.params.projectId);
    const result = validateImportResponse({ user: ctx.user, project, body: ctx.body });
    sendJson(ctx, result.status, result.body);
  });

  router.post('/api/v1/projects/:projectId/imports/commit', ...secureWrite, async (ctx) => {
    const project = stores.projectStore.find((c) => c.id === ctx.params.projectId);
    const result = commitImportResponse({ user: ctx.user, project, body: ctx.body, idempotencyKey: ctx.idempotencyKey });
    if (result.status === 201) {
      stores.importStore.push(...result.body.data.rows.map((row) => ({ id: crypto.randomUUID(), ...row, projectId: project.id })));
    }
    sendJson(ctx, result.status, result.body);
  });

  router.post('/api/v1/projects/:projectId/commitments', ...secureWrite, async (ctx) => {
    const project = stores.projectStore.find((c) => c.id === ctx.params.projectId);
    const result = createCommitmentResponse({ user: ctx.user, project, existing: stores.commitmentStore, body: ctx.body, idempotencyKey: ctx.idempotencyKey });
    if (result.status === 201) {
      result.body.data = { id: crypto.randomUUID(), ...result.body.data };
      if (persistence.transaction?.commitment) await persistence.transaction.commitment(result.body.data);
      stores.commitmentStore.push(result.body.data);
      (eventBus || ctx.eventBus)?.publish(project.id, {
        type: 'COMMITMENT_CREATED',
        commitmentId: result.body.data.id,
        amount: result.body.data.amount
      });
    }
    sendJson(ctx, result.status, result.body);
  });

  router.post('/api/v1/periods/:periodId/actual-costs', ...secureWrite, async (ctx) => {
    const period = stores.periodStore.find((c) => c.id === ctx.params.periodId);
    const project = stores.projectStore.find((c) => c.id === period?.projectId);
    const result = postActualResponse({ user: ctx.user, project, period, body: ctx.body, idempotencyKey: ctx.idempotencyKey });
    if (result.status === 201) {
      result.body.data = { id: crypto.randomUUID(), ...result.body.data };
      if (persistence.transaction?.actual) await persistence.transaction.actual(result.body.data);
      stores.actualStore.push(result.body.data);
      if (project?.id) {
        (eventBus || ctx.eventBus)?.publish(project.id, {
          type: 'ACTUAL_POSTED',
          actualId: result.body.data.id,
          amount: result.body.data.amount
        });
      }
    }
    sendJson(ctx, result.status, result.body);
  });

  router.post('/api/v1/periods/:periodId/accruals', ...secureWrite, async (ctx) => {
    const period = stores.periodStore.find((c) => c.id === ctx.params.periodId);
    const project = stores.projectStore.find((c) => c.id === period?.projectId);
    const result = createAccrualResponse({ user: ctx.user, project, period, body: ctx.body, idempotencyKey: ctx.idempotencyKey });
    if (result.status === 201) {
      result.body.data = { id: crypto.randomUUID(), ...result.body.data };
      if (persistence.transaction?.accrual) await persistence.transaction.accrual(result.body.data);
      stores.accrualStore.push(result.body.data);
    }
    sendJson(ctx, result.status, result.body);
  });

  router.post('/api/v1/periods/:periodId/forecast', ...secureWrite, async (ctx) => {
    const period = stores.periodStore.find((c) => c.id === ctx.params.periodId);
    const project = stores.projectStore.find((c) => c.id === period?.projectId);
    const result = calculateForecastResponse({ user: ctx.user, project, period, body: ctx.body, idempotencyKey: ctx.idempotencyKey });
    if (result.status === 200) {
      result.body.data = { id: crypto.randomUUID(), projectId: project.id, periodId: period.id, ...result.body.data };
      if (persistence.forecast?.save) await persistence.forecast.save(result.body.data);
      stores.forecastStore.push(result.body.data);
    }
    sendJson(ctx, result.status, result.body);
  });

  router.post('/api/v1/periods/:periodId/evm', ...secureWrite, async (ctx) => {
    const period = stores.periodStore.find((c) => c.id === ctx.params.periodId);
    const project = stores.projectStore.find((c) => c.id === period?.projectId);
    const result = calculateEvmResponse({ user: ctx.user, project, period, body: ctx.body, idempotencyKey: ctx.idempotencyKey });
    if (result.status === 200) {
      result.body.data = { id: crypto.randomUUID(), projectId: project.id, periodId: period.id, ...result.body.data };
      if (persistence.evm?.save) await persistence.evm.save(result.body.data);
      stores.evmStore.push({ bac: ctx.body.bac, ...result.body.data });
    }
    sendJson(ctx, result.status, result.body);
  });

  router.post('/api/v1/projects/:projectId/changes', ...secureWrite, async (ctx) => {
    const project = stores.projectStore.find((c) => c.id === ctx.params.projectId);
    const result = createChangeResponse({ user: ctx.user, project, body: ctx.body, idempotencyKey: ctx.idempotencyKey });
    if (result.status === 201) {
      result.body.data = { id: crypto.randomUUID(), ...result.body.data };
      if (persistence.change?.create) await persistence.change.create(result.body.data);
      stores.changeStore.push(result.body.data);
      (eventBus || ctx.eventBus)?.publish(project.id, {
        type: 'CHANGE_RECORDED',
        changeId: result.body.data.id,
        amount: result.body.data.amount
      });
    }
    sendJson(ctx, result.status, result.body);
  });

  router.post('/api/v1/changes/:changeId/incorporate', ...secureWrite, async (ctx) => {
    const change = stores.changeStore.find((c) => c.id === ctx.params.changeId);
    const project = stores.projectStore.find((c) => c.id === change?.projectId);
    const result = incorporateChangeResponse({ user: ctx.user, project, change, idempotencyKey: ctx.idempotencyKey });
    if (result.status === 200) {
      change.status = result.body.data.status;
      change.approvedCost = result.body.data.approvedCost;
      if (persistence.change?.incorporate) await persistence.change.incorporate({ id: change.id, approvedCost: change.approvedCost, status: change.status });
      if (persistence.audit?.record) await persistence.audit.record({ organizationId: ctx.user.organizationId, projectId: project.id, actorUserId: ctx.user.userId, actorType: 'USER', action: 'CHANGE_INCORPORATED', entityType: 'CHANGE', entityId: change.id, newValue: result.body.data });
      if (project?.id) {
        (eventBus || ctx.eventBus)?.publish(project.id, {
          type: 'CHANGE_INCORPORATED',
          changeId: change.id,
          status: change.status
        });
      }
    }
    sendJson(ctx, result.status, result.body);
  });

  router.post('/api/v1/projects/:projectId/cash-flow', ...secureWrite, async (ctx) => {
    const project = stores.projectStore.find((c) => c.id === ctx.params.projectId);
    const result = cashSummaryResponse({ user: ctx.user, project, body: ctx.body });
    if (result.status === 200) {
      const snapshot = { id: crypto.randomUUID(), projectId: project.id, periodId: ctx.body.periodId ?? null, planned: ctx.body.planned, actual: ctx.body.actual, forecast: ctx.body.forecast ?? [], variance: result.body.data.variance, cumulativeForecast: result.body.data.cumulativeForecast };
      if (persistence.cashFlow?.save) await persistence.cashFlow.save(snapshot);
    }
    sendJson(ctx, result.status, result.body);
  });

  router.post('/api/v1/projects/:projectId/risks', ...secureWrite, async (ctx) => {
    const project = stores.projectStore.find((c) => c.id === ctx.params.projectId);
    const result = createRiskResponse({ user: ctx.user, project, body: ctx.body, idempotencyKey: ctx.idempotencyKey });
    if (result.status === 201) {
      result.body.data = { id: crypto.randomUUID(), ...result.body.data };
      if (persistence.risk?.create) await persistence.risk.create(result.body.data);
      stores.riskStore.push(result.body.data);
    }
    sendJson(ctx, result.status, result.body);
  });

  router.post('/api/v1/projects/:projectId/agent-findings', ...secureWrite, async (ctx) => {
    const project = stores.projectStore.find((c) => c.id === ctx.params.projectId);
    const result = createFindingResponse({ user: ctx.user, project, body: ctx.body, idempotencyKey: ctx.idempotencyKey });
    if (result.status === 201) {
      result.body.data = { id: crypto.randomUUID(), ...result.body.data };
      if (persistence.finding?.create) await persistence.finding.create(result.body.data);
      stores.findingStore.push(result.body.data);
    }
    sendJson(ctx, result.status, result.body);
  });

  router.post('/api/v1/agent-findings/:findingId/review', ...secureWrite, async (ctx) => {
    const finding = stores.findingStore.find((c) => c.id === ctx.params.findingId);
    const project = stores.projectStore.find((c) => c.id === finding?.projectId);
    const result = reviewFindingResponse({ user: ctx.user, project, finding, body: ctx.body, idempotencyKey: ctx.idempotencyKey });
    if (result.status === 200) {
      Object.assign(finding, result.body.data);
      if (persistence.finding?.review) await persistence.finding.review({ id: finding.id, reviewedBy: ctx.user.userId, status: finding.status, reason: finding.reason });
      if (persistence.audit?.record) await persistence.audit.record({ organizationId: ctx.user.organizationId, projectId: project.id, actorUserId: ctx.user.userId, actorType: 'USER', action: 'FINDING_REVIEWED', entityType: 'AGENT_FINDING', entityId: finding.id, newValue: result.body.data, reason: finding.reason });
    }
    sendJson(ctx, result.status, result.body);
  });

  router.post(['/api/v1/projects/:projectId/agents/:agentName/run', '/projects/:projectId/agents/:agentName/run'], ...secureWrite, async (ctx) => {
    if (!checkProjectScope(ctx)) return;
    const project = stores.projectStore.find((c) => c.id === ctx.params.projectId);
    if (!project) return sendJson(ctx, 404, { error: { code: 'NOT_FOUND', message: 'project not found' } });

    const context = {
      projectId: project.id,
      baselines: stores.baselineStore.filter((b) => b.projectId === project.id),
      commitments: stores.commitmentStore.filter((c) => c.projectId === project.id),
      actualCosts: stores.actualStore.filter((a) => a.projectId === project.id),
      forecasts: stores.forecastStore.filter((f) => f.projectId === project.id),
      evmMetrics: stores.evmStore.filter((e) => e.projectId === project.id)
    };

    try {
      let findings;
      if (ctx.params.agentName === 'all') {
        findings = await defaultAgentRegistry.runAll(context);
      } else {
        findings = await defaultAgentRegistry.runAgent(ctx.params.agentName, context);
      }

      for (const finding of findings) {
        const fullFinding = { id: crypto.randomUUID(), ...finding, status: 'NEW' };
        stores.findingStore.push(fullFinding);
        if (persistence.finding?.create) await persistence.finding.create(fullFinding);
      }

      (eventBus || ctx.eventBus)?.publish(project.id, {
        type: 'AGENT_RUN_COMPLETED',
        agent: ctx.params.agentName,
        findingsCount: findings.length
      });

      sendJson(ctx, 200, { data: { agent: ctx.params.agentName, findingsCount: findings.length, findings } });
    } catch (err) {
      sendJson(ctx, 400, { error: { code: 'AGENT_RUN_FAILED', message: err.message } });
    }
  });

  router.post(['/api/v1/projects/:projectId/advisor', '/projects/:projectId/advisor'], ...secureWrite, async (ctx) => {
    if (!checkProjectScope(ctx)) return;
    const project = stores.projectStore.find((c) => c.id === ctx.params.projectId);
    if (!project) return sendJson(ctx, 404, { error: { code: 'NOT_FOUND', message: 'project not found' } });

    const evmMetrics = stores.evmStore.filter((e) => e.projectId === project.id);
    const latestEvm = evmMetrics[evmMetrics.length - 1];

    const ledgerContext = {
      projectId: project.id,
      evm: latestEvm || { cpi: 1.0, spi: 1.0, bac: 0, eac: 0 },
      commitmentsCount: stores.commitmentStore.filter((c) => c.projectId === project.id).length,
      actualCostTotal: stores.actualStore.filter((a) => a.projectId === project.id).reduce((s, a) => s + Number(a.amount || 0), 0)
    };

    try {
      const advisor = new SumopodLlmAdvisor();
      const question = ctx.body?.question || 'What is the project cost status?';
      const result = await advisor.advise({ question, ledgerContext });
      sendJson(ctx, 200, { data: result });
    } catch (err) {
      sendJson(ctx, 500, { error: { code: 'ADVISOR_FAILED', message: err.message } });
    }
  });
}
