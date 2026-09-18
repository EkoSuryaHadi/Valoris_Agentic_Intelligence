import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('MVP-A UI shell is workspace-first and contains core navigation surfaces', async () => {
  const html = await readFile(new URL('./index.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('./styles.css', import.meta.url), 'utf8');
  assert.match(html, /WBS \/ CBS/);
  assert.match(html, /Baseline control/);
  assert.match(html, /Import center/);
  assert.match(html, /Audit trail/);
  assert.match(html, /data-add-wbs-node/);
  assert.match(html, /data-wbs-form/);
  assert.match(html, /data-wbs-feedback/);
  assert.match(html, /data-create-baseline/);
  assert.match(html, /data-baseline-feedback/);
  assert.match(html, /data-budget-line-form/);
  assert.match(html, /data-budget-line-feedback/);
  assert.match(html, /data-review-baseline/);
  assert.match(html, /data-review-form/);
  assert.match(html, /data-review-feedback/);
  assert.doesNotMatch(html, /chatbot|chat with/i);
  assert.match(css, /--sidebar:\s*#0F172A/i);
  assert.match(css, /--canvas:\s*#F8FAFC/i);
  assert.match(css, /--primary:\s*#4F46E5/i);
});
