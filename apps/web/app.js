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
  }
}

if (typeof document !== 'undefined') startWorkspace(document);
