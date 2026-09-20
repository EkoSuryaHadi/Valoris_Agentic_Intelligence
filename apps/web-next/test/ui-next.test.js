import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

test('web-next contains canonical Industrial Editorial design tokens', async () => {
  const tokensCss = await readFile(join(__dirname, '../src/styles/tokens.css'), 'utf8');
  assert.match(tokensCss, /--color-amber:\s*#D4871C/);
  assert.match(tokensCss, /--color-dark-ink-teal:\s*#1B2B31/);
  assert.match(tokensCss, /--color-warm-paper:\s*#F8F5EF/);
  assert.match(tokensCss, /--color-ink:\s*#243047/);
});

test('web-next implements 5 visual state classes', async () => {
  const indexCss = await readFile(join(__dirname, '../src/styles/index.css'), 'utf8');
  assert.match(indexCss, /\.state-loading/);
  assert.match(indexCss, /\.state-empty/);
  assert.match(indexCss, /\.state-error/);
  assert.match(indexCss, /\.state-stale/);
  assert.match(indexCss, /\.state-locked/);
});

test('web-next contains all 14 modular screen components', async () => {
  const screens = [
    'Executive.tsx',
    'Overview.tsx',
    'Structure.tsx',
    'Baseline.tsx',
    'Imports.tsx',
    'Transactions.tsx',
    'Forecast.tsx',
    'Evm.tsx',
    'Changes.tsx',
    'CashFlow.tsx',
    'Risks.tsx',
    'AgentCenter.tsx',
    'Reports.tsx',
    'Audit.tsx'
  ];

  for (const screen of screens) {
    const filePath = join(__dirname, '../src/screens', screen);
    await assert.doesNotReject(access(filePath), `Screen component ${screen} must exist`);
  }
});

test('web-next contains core reusable UI primitives and charts', async () => {
  const components = [
    'ui/MetricCard.tsx',
    'ui/DataTable.tsx',
    'ui/StatusBadge.tsx',
    'ui/StateView.tsx',
    'ui/ExportButton.tsx',
    'charts/SCurve.tsx',
    'charts/TrendLine.tsx',
    'layout/Shell.tsx',
    'layout/Rail.tsx',
    'layout/Topbar.tsx'
  ];

  for (const comp of components) {
    const filePath = join(__dirname, '../src/components', comp);
    await assert.doesNotReject(access(filePath), `Component ${comp} must exist`);
  }
});

test('web-next production build artifacts exist and are non-empty', async () => {
  const htmlPath = join(__dirname, '../dist/index.html');
  await assert.doesNotReject(access(htmlPath), 'dist/index.html must exist from build');
  const html = await readFile(htmlPath, 'utf8');
  assert.match(html, /<div id="root"><\/div>/);
  assert.match(html, /VALORIS — Agentic Cost Intelligence/);
});
