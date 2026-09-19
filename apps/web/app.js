import { createApiClient } from './api-client.js';
import { selectActiveProject } from './project-context.js';

function renderRows(container, rows, render) {
  if (!container || !Array.isArray(rows)) return;
  container.replaceChildren(...rows.map(render));
}

function textCell(documentRef, value, tag = 'td') {
  const cell = documentRef.createElement(tag);
  cell.textContent = value;
  return cell;
}

export async function hydrateMvpA({ client, projectId, documentRef = document }) {
  const [wbs, baselines] = await Promise.all([client.getWbs(projectId), client.getBaselines(projectId)]);
  renderRows(documentRef.querySelector('[data-wbs-tree]'), wbs, (node) => {
    const row = documentRef.createElement('div');
    row.className = 'tree-row';
    row.append(textCell(documentRef, node.code, 'span'), textCell(documentRef, node.name, 'strong'), textCell(documentRef, `L${node.level}`, 'small'));
    return row;
  });
  renderRows(documentRef.querySelector('[data-baseline-table]'), baselines, (baseline) => {
    const row = documentRef.createElement('tr');
    row.append(textCell(documentRef, `v${baseline.version}`), textCell(documentRef, baseline.status));
    return row;
  });
  return { wbs, baselines };
}

function startWorkspace(documentRef) {
  const views = [...documentRef.querySelectorAll('[data-view]')];
  const triggers = [...documentRef.querySelectorAll('[data-screen]')];

  function navigate(screen) {
    views.forEach((view) => view.classList.toggle('is-hidden', view.dataset.view !== screen));
    triggers.forEach((trigger) => trigger.classList.toggle('is-active', trigger.dataset.screen === screen));
    if (window.location.hash !== `#${screen}`) history.replaceState(null, '', `#${screen}`);
  }

  triggers.forEach((trigger) => trigger.addEventListener('click', (event) => {
    event.preventDefault();
    navigate(trigger.dataset.screen);
  }));

  navigate(window.location.hash.slice(1) || 'overview');
  const wbsForm = documentRef.querySelector('[data-wbs-form]');
  const wbsFeedback = documentRef.querySelector('[data-wbs-feedback]');
  const baselineFeedback = documentRef.querySelector('[data-baseline-feedback]');
  const baselineButton = documentRef.querySelector('[data-create-baseline]');
  const budgetLineButton = documentRef.querySelector('[data-add-budget-line]');
  const budgetLineForm = documentRef.querySelector('[data-budget-line-form]');
  const budgetLineFeedback = documentRef.querySelector('[data-budget-line-feedback]');
  const reviewButton = documentRef.querySelector('[data-review-baseline]');
  const reviewForm = documentRef.querySelector('[data-review-form]');
  const reviewFeedback = documentRef.querySelector('[data-review-feedback]');
  const importForm = documentRef.querySelector('[data-import-preview-form]');
  const importFeedback = documentRef.querySelector('[data-import-preview-feedback]');
  const importSummary = documentRef.querySelector('[data-import-preview-summary]');
  const importFile = documentRef.querySelector('[data-import-file]');
  const importStepperFeedback = documentRef.querySelector('[data-import-stepper-feedback]');
  const commitmentForm = documentRef.querySelector('[data-commitment-form]');
  const actualCostForm = documentRef.querySelector('[data-actual-cost-form]');
  const transactionFeedback = documentRef.querySelector('[data-transaction-feedback]');
  const accrualForm = documentRef.querySelector('[data-accrual-form]');
  const accrualFeedback = documentRef.querySelector('[data-accrual-feedback]');
  const forecastForm = documentRef.querySelector('[data-forecast-form]');
  const forecastFeedback = documentRef.querySelector('[data-forecast-feedback]');
  const forecastEac = documentRef.querySelector('[data-forecast-eac]');
  const forecastVac = documentRef.querySelector('[data-forecast-vac]');
  const evmForm = documentRef.querySelector('[data-evm-form]');
  const evmFeedback = documentRef.querySelector('[data-evm-feedback]');
  const evmCpi = documentRef.querySelector('[data-evm-cpi]');
  const evmSpi = documentRef.querySelector('[data-evm-spi]');
  const evmCv = documentRef.querySelector('[data-evm-cv]');
  const changeForm = documentRef.querySelector('[data-change-form]');
  const changeFeedback = documentRef.querySelector('[data-change-feedback]');
  const cashFlowForm = documentRef.querySelector('[data-cash-flow-form]');
  const cashFlowFeedback = documentRef.querySelector('[data-cash-flow-feedback]');
  const riskForm = documentRef.querySelector('[data-risk-form]');
  const riskFeedback = documentRef.querySelector('[data-risk-feedback]');
  const findingReviewForm = documentRef.querySelector('[data-finding-review-form]');
  const findingReviewFeedback = documentRef.querySelector('[data-finding-review-feedback]');
  let previewRows;
  const importCommitButton = importForm ? documentRef.createElement('button') : null;
  if (importCommitButton) { importCommitButton.type = 'button'; importCommitButton.className = 'secondary-button'; importCommitButton.textContent = 'Commit validated rows →'; importCommitButton.disabled = true; importCommitButton.dataset.importCommit = 'true'; importForm.append(importCommitButton); }
  const setWbsFormOpen = (open) => {
    if (wbsForm) wbsForm.classList.toggle('is-hidden', !open);
    if (!open && wbsFeedback) wbsFeedback.textContent = '';
  };
  documentRef.querySelector('[data-add-wbs-node]')?.addEventListener('click', () => setWbsFormOpen(true));
  documentRef.querySelector('[data-cancel-wbs-node]')?.addEventListener('click', () => setWbsFormOpen(false));
  budgetLineButton?.addEventListener('click', () => budgetLineForm?.classList.remove('is-hidden'));
  documentRef.querySelector('[data-cancel-budget-line]')?.addEventListener('click', () => budgetLineForm?.classList.add('is-hidden'));
  reviewButton?.addEventListener('click', () => reviewForm?.classList.remove('is-hidden'));
  documentRef.querySelector('[data-cancel-review]')?.addEventListener('click', () => reviewForm?.classList.add('is-hidden'));
  const config = globalThis.VALORIS_API_CONFIG;
  const runtimeStatus = documentRef.querySelector('[data-runtime-status]');
  if (config?.baseUrl && typeof config.tokenProvider === 'function') {
    const client = createApiClient(config);
    const selector = documentRef.querySelector('[data-project-selector]');
    const projectName = documentRef.querySelector('[data-project-name]');
    let activeProject;
    let activeBaseline;
    importFile?.addEventListener('change', async () => {
      const file = importFile.files?.[0];
      if (!file) return;
      try {
        const [headerLine, ...dataLines] = (await file.text()).trim().split(/\r?\n/);
        const headers = headerLine.split(',').map((header) => header.trim());
        const referenceKey = documentRef.querySelector('[data-import-mapping="referenceNo"]')?.value || 'referenceNo';
        const amountKey = documentRef.querySelector('[data-import-mapping="amount"]')?.value || 'amount';
        const referenceIndex = headers.indexOf(referenceKey); const amountIndex = headers.indexOf(amountKey);
        if (referenceIndex < 0 || amountIndex < 0) throw new Error('Map reference and amount columns before loading the file.');
        const rows = dataLines.filter(Boolean).map((line) => { const values = line.split(','); return { referenceNo: values[referenceIndex]?.trim(), amount: values[amountIndex]?.trim(), projectId: activeProject?.id }; });
        const rowsField = importForm?.querySelector('textarea[name="rows"]');
        if (rowsField) rowsField.value = JSON.stringify(rows, null, 2);
        if (importStepperFeedback) importStepperFeedback.textContent = `${rows.length} rows loaded. Review mapping, then run validation.`;
      } catch (error) { if (importStepperFeedback) importStepperFeedback.textContent = error.message || 'Could not read CSV file.'; }
    });
    const activate = async (project) => {
      if (!project) return;
      activeProject = project;
      if (projectName) projectName.textContent = project.name;
      if (selector) selector.value = project.id;
      const hydrated = await hydrateMvpA({ client, projectId: project.id, documentRef });
      activeBaseline = hydrated.baselines.find((baseline) => baseline.status === 'DRAFT') || hydrated.baselines[0];
      if (runtimeStatus) runtimeStatus.textContent = 'Live project data';
    };
    wbsForm?.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!activeProject) { if (wbsFeedback) wbsFeedback.textContent = 'Choose an authorized project before creating a node.'; return; }
      const data = new FormData(wbsForm);
      const payload = { code: data.get('code')?.trim(), name: data.get('name')?.trim(), level: Number(data.get('level')) };
      if (!payload.code || !payload.name) { if (wbsFeedback) wbsFeedback.textContent = 'Code and node name are required.'; return; }
      if (wbsFeedback) wbsFeedback.textContent = 'Creating WBS node…';
      try {
        await client.createWbsNode(activeProject.id, payload, globalThis.crypto?.randomUUID?.());
        await activate(activeProject);
        wbsForm.reset();
        if (wbsFeedback) wbsFeedback.textContent = 'WBS node created and added to the project structure.';
      } catch (error) {
        if (wbsFeedback) wbsFeedback.textContent = error.message || 'The WBS node could not be created.';
      }
    });
    baselineButton?.addEventListener('click', async () => {
      if (!activeProject) { if (baselineFeedback) baselineFeedback.textContent = 'Choose an authorized project before creating a baseline.'; return; }
      if (baselineFeedback) baselineFeedback.textContent = 'Creating draft baseline…';
      try {
        await client.createBaseline(activeProject.id, {}, globalThis.crypto?.randomUUID?.());
        await activate(activeProject);
        if (baselineFeedback) baselineFeedback.textContent = 'Draft baseline created. Review its budget lines before submission.';
      } catch (error) {
        if (baselineFeedback) baselineFeedback.textContent = error.message || 'The baseline draft could not be created.';
      }
    });
    budgetLineForm?.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!activeBaseline) { if (budgetLineFeedback) budgetLineFeedback.textContent = 'Create or select a baseline before adding a budget line.'; return; }
      const data = new FormData(budgetLineForm);
      const amount = Number(data.get('amount'));
      const payload = { wbsId: data.get('wbsId')?.trim(), costCodeId: data.get('costCodeId')?.trim(), amount };
      if (!payload.wbsId || !payload.costCodeId || !Number.isFinite(amount) || amount < 0) { if (budgetLineFeedback) budgetLineFeedback.textContent = 'WBS ID, cost code ID, and a non-negative amount are required.'; return; }
      if (budgetLineFeedback) budgetLineFeedback.textContent = 'Adding budget line…';
      try {
        await client.createBudgetLine(activeBaseline.id, payload, globalThis.crypto?.randomUUID?.());
        if (budgetLineFeedback) budgetLineFeedback.textContent = 'Budget line added to the open baseline.';
        budgetLineForm.reset();
      } catch (error) {
        if (budgetLineFeedback) budgetLineFeedback.textContent = error.message || 'The budget line could not be added.';
      }
    });
    reviewForm?.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!activeBaseline) { if (reviewFeedback) reviewFeedback.textContent = 'Select a baseline before recording a decision.'; return; }
      const data = new FormData(reviewForm);
      const payload = { nextStatus: data.get('nextStatus'), reason: data.get('reason')?.trim() };
      if (!payload.reason) { if (reviewFeedback) reviewFeedback.textContent = 'An audit reason is required.'; return; }
      if (reviewFeedback) reviewFeedback.textContent = 'Recording human decision…';
      try {
        await client.transitionBaseline(activeBaseline.id, payload, globalThis.crypto?.randomUUID?.());
        await activate(activeProject);
        reviewForm.reset();
        reviewForm.classList.add('is-hidden');
        if (baselineFeedback) baselineFeedback.textContent = `Baseline decision recorded: ${payload.nextStatus}.`;
      } catch (error) {
        if (reviewFeedback) reviewFeedback.textContent = error.message || 'The baseline decision could not be recorded.';
      }
    });
    commitmentForm?.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!activeProject) { if (transactionFeedback) transactionFeedback.textContent = 'Choose an authorized project before recording a commitment.'; return; }
      const data = new FormData(commitmentForm);
      const payload = { referenceNo: data.get('referenceNo')?.trim(), vendor: data.get('vendor')?.trim(), amount: Number(data.get('amount')) };
      if (!payload.referenceNo || !payload.vendor || !Number.isFinite(payload.amount) || payload.amount < 0) { if (transactionFeedback) transactionFeedback.textContent = 'Reference, vendor, and a non-negative amount are required.'; return; }
      if (transactionFeedback) transactionFeedback.textContent = 'Saving commitment…';
      try { await client.createCommitment(activeProject.id, payload, globalThis.crypto?.randomUUID?.()); commitmentForm.reset(); if (transactionFeedback) transactionFeedback.textContent = 'Commitment saved with source trace.'; } catch (error) { if (transactionFeedback) transactionFeedback.textContent = error.message || 'The commitment could not be saved.'; }
    });
    actualCostForm?.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!activeProject) { if (transactionFeedback) transactionFeedback.textContent = 'Choose an authorized project before posting actual cost.'; return; }
      const data = new FormData(actualCostForm);
      const periodId = data.get('periodId')?.trim();
      const payload = { sourceRef: data.get('sourceRef')?.trim(), amount: Number(data.get('amount')) };
      if (!periodId || !payload.sourceRef || !Number.isFinite(payload.amount) || payload.amount < 0) { if (transactionFeedback) transactionFeedback.textContent = 'Period, source reference, and a non-negative amount are required.'; return; }
      if (transactionFeedback) transactionFeedback.textContent = 'Posting actual cost…';
      try { await client.postActualCost(periodId, payload, globalThis.crypto?.randomUUID?.()); actualCostForm.reset(); if (transactionFeedback) transactionFeedback.textContent = 'Actual cost posted to the open period.'; } catch (error) { if (transactionFeedback) transactionFeedback.textContent = error.message || 'The actual cost could not be posted.'; }
    });
    accrualForm?.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!activeProject) { if (accrualFeedback) accrualFeedback.textContent = 'Choose an authorized project before recording an accrual.'; return; }
      const data = new FormData(accrualForm);
      const periodId = data.get('periodId')?.trim();
      const payload = { sourceRef: data.get('sourceRef')?.trim(), amount: Number(data.get('amount')) };
      if (!periodId || !payload.sourceRef || !Number.isFinite(payload.amount) || payload.amount < 0) { if (accrualFeedback) accrualFeedback.textContent = 'Period, source reference, and a non-negative amount are required.'; return; }
      if (accrualFeedback) accrualFeedback.textContent = 'Saving accrual…';
      try { await client.createAccrual(periodId, payload, globalThis.crypto?.randomUUID?.()); accrualForm.reset(); if (accrualFeedback) accrualFeedback.textContent = 'Accrual saved as draft with source trace.'; } catch (error) { if (accrualFeedback) accrualFeedback.textContent = error.message || 'The accrual could not be saved.'; }
    });
    forecastForm?.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!activeProject) { if (forecastFeedback) forecastFeedback.textContent = 'Choose an authorized project before calculating a forecast.'; return; }
      const data = new FormData(forecastForm);
      const periodId = data.get('periodId')?.trim();
      const payload = { bac: Number(data.get('bac')), actualCost: Number(data.get('actualCost')), etc: Number(data.get('etc')) };
      if (!periodId || Object.values(payload).some((value) => !Number.isFinite(value) || value < 0)) { if (forecastFeedback) forecastFeedback.textContent = 'Period and non-negative BAC, AC, and ETC values are required.'; return; }
      if (forecastFeedback) forecastFeedback.textContent = 'Calculating forecast…';
      try { const result = await client.calculateForecast(periodId, payload, globalThis.crypto?.randomUUID?.()); if (forecastEac) forecastEac.textContent = result.eac.toLocaleString(); if (forecastVac) forecastVac.textContent = result.vac.toLocaleString(); if (forecastFeedback) forecastFeedback.textContent = 'Forecast calculated. Submit it for authorized human review before lock.'; } catch (error) { if (forecastFeedback) forecastFeedback.textContent = error.message || 'The forecast could not be calculated.'; }
    });
    evmForm?.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!activeProject) { if (evmFeedback) evmFeedback.textContent = 'Choose an authorized project before calculating EVM.'; return; }
      const data = new FormData(evmForm);
      const periodId = data.get('periodId')?.trim();
      const payload = { bac: Number(data.get('bac')), plannedProgress: Number(data.get('plannedProgress')), actualProgress: Number(data.get('actualProgress')), actualCost: Number(data.get('actualCost')) };
      if (!periodId || !Number.isFinite(payload.bac) || !Number.isFinite(payload.actualCost) || payload.bac < 0 || payload.actualCost < 0 || [payload.plannedProgress, payload.actualProgress].some((value) => !Number.isFinite(value) || value < 0 || value > 1)) { if (evmFeedback) evmFeedback.textContent = 'Period, BAC, AC, and progress values must be valid.'; return; }
      if (evmFeedback) evmFeedback.textContent = 'Calculating EVM snapshot…';
      try { const result = await client.calculateEvm(periodId, payload, globalThis.crypto?.randomUUID?.()); if (evmCpi) evmCpi.textContent = result.cpi?.toFixed(2) ?? '—'; if (evmSpi) evmSpi.textContent = result.spi?.toFixed(2) ?? '—'; if (evmCv) evmCv.textContent = result.cv.toLocaleString(); if (evmFeedback) evmFeedback.textContent = 'EVM snapshot calculated from the submitted progress and cost evidence.'; } catch (error) { if (evmFeedback) evmFeedback.textContent = error.message || 'The EVM snapshot could not be calculated.'; }
    });
    changeForm?.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!activeProject) { if (changeFeedback) changeFeedback.textContent = 'Choose an authorized project before recording a change.'; return; }
      const data = new FormData(changeForm);
      const payload = { number: data.get('number')?.trim(), title: data.get('title')?.trim(), type: data.get('type'), estimatedCost: Number(data.get('estimatedCost')), probability: Number(data.get('probability')) };
      if (!payload.number || !payload.title || !Number.isFinite(payload.estimatedCost) || payload.estimatedCost < 0 || !Number.isFinite(payload.probability) || payload.probability < 0 || payload.probability > 1) { if (changeFeedback) changeFeedback.textContent = 'Number, title, non-negative estimated cost, and probability from 0 to 1 are required.'; return; }
      if (changeFeedback) changeFeedback.textContent = 'Saving potential change…';
      try { const result = await client.createChange(activeProject.id, payload, globalThis.crypto?.randomUUID?.()); changeForm.reset(); if (changeFeedback) changeFeedback.textContent = `Change ${result.number} saved with weighted exposure ${result.exposure}. Awaiting human decision.`; } catch (error) { if (changeFeedback) changeFeedback.textContent = error.message || 'The change could not be saved.'; }
    });
    cashFlowForm?.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!activeProject) { if (cashFlowFeedback) cashFlowFeedback.textContent = 'Choose an authorized project before calculating cash flow.'; return; }
      const data = new FormData(cashFlowForm);
      const parse = (name) => String(data.get(name) || '').split(',').map(Number);
      const payload = { planned: parse('planned'), actual: parse('actual'), forecast: parse('forecast') };
      if (payload.planned.some((value) => !Number.isFinite(value)) || payload.actual.some((value) => !Number.isFinite(value)) || payload.forecast.some((value) => !Number.isFinite(value))) { if (cashFlowFeedback) cashFlowFeedback.textContent = 'Enter comma-separated numeric values for each period series.'; return; }
      if (cashFlowFeedback) cashFlowFeedback.textContent = 'Calculating cash variance…';
      try { const result = await client.getCashFlow(activeProject.id, payload); if (cashFlowFeedback) cashFlowFeedback.textContent = `Cash variance calculated across ${result.variance.length} aligned periods.`; } catch (error) { if (cashFlowFeedback) cashFlowFeedback.textContent = error.message || 'The cash flow summary could not be calculated.'; }
    });
    riskForm?.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!activeProject) { if (riskFeedback) riskFeedback.textContent = 'Choose an authorized project before recording a risk.'; return; }
      const data = new FormData(riskForm); const payload = { title: data.get('title')?.trim(), category: data.get('category')?.trim(), probability: Number(data.get('probability')), impact: Number(data.get('impact')) };
      if (!payload.title || !payload.category || !Number.isFinite(payload.probability) || payload.probability < 0 || payload.probability > 1 || !Number.isFinite(payload.impact) || payload.impact < 0) { if (riskFeedback) riskFeedback.textContent = 'Title, category, probability from 0 to 1, and non-negative impact are required.'; return; }
      if (riskFeedback) riskFeedback.textContent = 'Saving risk…'; try { const result = await client.createRisk(activeProject.id, payload, globalThis.crypto?.randomUUID?.()); riskForm.reset(); if (riskFeedback) riskFeedback.textContent = `Risk saved with ${result.severity} severity and exposure ${result.exposure}.`; } catch (error) { if (riskFeedback) riskFeedback.textContent = error.message || 'The risk could not be saved.'; }
    });
    findingReviewForm?.addEventListener('submit', async (event) => {
      event.preventDefault(); const data = new FormData(findingReviewForm); const findingId = data.get('findingId')?.trim(); const payload = { decision: data.get('decision'), reason: data.get('reason')?.trim() };
      if (!findingId || !payload.reason) { if (findingReviewFeedback) findingReviewFeedback.textContent = 'Finding ID and review reason are required.'; return; }
      if (findingReviewFeedback) findingReviewFeedback.textContent = 'Recording human decision…'; try { await client.reviewFinding(findingId, payload, globalThis.crypto?.randomUUID?.()); if (findingReviewFeedback) findingReviewFeedback.textContent = `Finding marked ${payload.decision} with an audit reason.`; } catch (error) { if (findingReviewFeedback) findingReviewFeedback.textContent = error.message || 'The finding decision could not be recorded.'; }
    });
    importForm?.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!activeProject) { if (importFeedback) importFeedback.textContent = 'Choose an authorized project before previewing rows.'; return; }
      try {
        const rows = JSON.parse(new FormData(importForm).get('rows'));
        if (!Array.isArray(rows)) throw new Error('Rows JSON must be an array.');
        if (importFeedback) importFeedback.textContent = 'Validating rows…';
        const result = await client.previewImport(activeProject.id, { rows });
        previewRows = result.errors.length === 0 ? rows : undefined;
        if (importCommitButton) importCommitButton.disabled = !previewRows;
        if (importFeedback) importFeedback.textContent = `Preview ready: ${result.valid.length} valid, ${result.errors.length} errors.`;
        if (importSummary) importSummary.textContent = `${result.total} total rows · ${result.valid.length} ready · ${result.errors.length} need attention`;
      } catch (error) {
        if (importFeedback) importFeedback.textContent = error.message || 'Import preview failed.';
        if (importSummary) importSummary.textContent = '';
      }
    });
    importCommitButton?.addEventListener('click', async () => {
      if (!previewRows || !activeProject) return;
      if (importFeedback) importFeedback.textContent = 'Committing validated rows…';
      try {
        const result = await client.commitImport(activeProject.id, { rows: previewRows }, globalThis.crypto?.randomUUID?.());
        if (importFeedback) importFeedback.textContent = `${result.importedCount} rows committed with audit trace.`;
        previewRows = undefined;
        importCommitButton.disabled = true;
      } catch (error) { if (importFeedback) importFeedback.textContent = error.message || 'Import commit failed.'; }
    });
    client.listProjects().then(async (projects) => {
      const active = selectActiveProject(projects, config.projectId);
      if (!active) { if (runtimeStatus) runtimeStatus.textContent = 'No authorized project'; return; }
      if (selector) {
        selector.replaceChildren(...projects.map((project) => {
          const option = documentRef.createElement('option'); option.value = project.id; option.textContent = project.name; return option;
        }));
        selector.addEventListener('change', () => activate(selectActiveProject(projects, selector.value)));
      }
      await activate(active);
    }).catch(() => { if (runtimeStatus) runtimeStatus.textContent = 'Demo data — live connection unavailable'; });
  } else {
    wbsForm?.addEventListener('submit', (event) => { event.preventDefault(); if (wbsFeedback) wbsFeedback.textContent = 'Connect to an authorized project workspace to create a WBS node.'; });
    baselineButton?.addEventListener('click', () => { if (baselineFeedback) baselineFeedback.textContent = 'Connect to an authorized project workspace to create a baseline draft.'; });
    budgetLineForm?.addEventListener('submit', (event) => { event.preventDefault(); if (budgetLineFeedback) budgetLineFeedback.textContent = 'Connect to an authorized project workspace to add a budget line.'; });
    reviewButton?.addEventListener('click', () => reviewForm?.classList.remove('is-hidden'));
    reviewForm?.addEventListener('submit', (event) => { event.preventDefault(); if (reviewFeedback) reviewFeedback.textContent = 'Connect to an authorized project workspace to record a baseline decision.'; });
    importForm?.addEventListener('submit', (event) => { event.preventDefault(); if (importFeedback) importFeedback.textContent = 'Connect to an authorized project workspace to preview import rows.'; });
    commitmentForm?.addEventListener('submit', (event) => { event.preventDefault(); if (transactionFeedback) transactionFeedback.textContent = 'Connect to an authorized project workspace to record a commitment.'; });
    actualCostForm?.addEventListener('submit', (event) => { event.preventDefault(); if (transactionFeedback) transactionFeedback.textContent = 'Connect to an authorized project workspace to post actual cost.'; });
    accrualForm?.addEventListener('submit', (event) => { event.preventDefault(); if (accrualFeedback) accrualFeedback.textContent = 'Connect to an authorized project workspace to record an accrual.'; });
    forecastForm?.addEventListener('submit', (event) => { event.preventDefault(); if (forecastFeedback) forecastFeedback.textContent = 'Connect to an authorized project workspace to calculate a forecast.'; });
    evmForm?.addEventListener('submit', (event) => { event.preventDefault(); if (evmFeedback) evmFeedback.textContent = 'Connect to an authorized project workspace to calculate EVM.'; });
    changeForm?.addEventListener('submit', (event) => { event.preventDefault(); if (changeFeedback) changeFeedback.textContent = 'Connect to an authorized project workspace to record a change.'; });
    cashFlowForm?.addEventListener('submit', (event) => { event.preventDefault(); if (cashFlowFeedback) cashFlowFeedback.textContent = 'Connect to an authorized project workspace to calculate cash flow.'; });
    riskForm?.addEventListener('submit', (event) => { event.preventDefault(); if (riskFeedback) riskFeedback.textContent = 'Connect to an authorized project workspace to record a risk.'; });
    findingReviewForm?.addEventListener('submit', (event) => { event.preventDefault(); if (findingReviewFeedback) findingReviewFeedback.textContent = 'Connect to an authorized project workspace to review a finding.'; });
  }
}

if (typeof document !== 'undefined') startWorkspace(document);
