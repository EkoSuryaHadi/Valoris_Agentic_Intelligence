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
  const setWbsFormOpen = (open) => {
    if (wbsForm) wbsForm.classList.toggle('is-hidden', !open);
    if (!open && wbsFeedback) wbsFeedback.textContent = '';
  };
  documentRef.querySelector('[data-add-wbs-node]')?.addEventListener('click', () => setWbsFormOpen(true));
  documentRef.querySelector('[data-cancel-wbs-node]')?.addEventListener('click', () => setWbsFormOpen(false));
  const config = globalThis.VALORIS_API_CONFIG;
  const runtimeStatus = documentRef.querySelector('[data-runtime-status]');
  if (config?.baseUrl && typeof config.tokenProvider === 'function') {
    const client = createApiClient(config);
    const selector = documentRef.querySelector('[data-project-selector]');
    const projectName = documentRef.querySelector('[data-project-name]');
    let activeProject;
    const activate = async (project) => {
      if (!project) return;
      activeProject = project;
      if (projectName) projectName.textContent = project.name;
      if (selector) selector.value = project.id;
      await hydrateMvpA({ client, projectId: project.id, documentRef });
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
  }
}

if (typeof document !== 'undefined') startWorkspace(document);
