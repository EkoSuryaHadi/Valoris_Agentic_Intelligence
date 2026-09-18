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
  const config = globalThis.VALORIS_API_CONFIG;
  const runtimeStatus = documentRef.querySelector('[data-runtime-status]');
  if (config?.baseUrl && typeof config.tokenProvider === 'function') {
    const client = createApiClient(config);
    const selector = documentRef.querySelector('[data-project-selector]');
    const projectName = documentRef.querySelector('[data-project-name]');
    const activate = async (project) => {
      if (!project) return;
      if (projectName) projectName.textContent = project.name;
      if (selector) selector.value = project.id;
      await hydrateMvpA({ client, projectId: project.id, documentRef });
      if (runtimeStatus) runtimeStatus.textContent = 'Live project data';
    };
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
  }
}

if (typeof document !== 'undefined') startWorkspace(document);
