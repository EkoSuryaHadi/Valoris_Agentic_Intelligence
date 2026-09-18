import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('MVP-A UI shell is workspace-first and contains core navigation surfaces', async () => {
  const html = await readFile(new URL('./index.html', import.meta.url), 'utf8');
  assert.match(html, /WBS \/ CBS/);
  assert.match(html, /Baseline control/);
  assert.match(html, /Import center/);
  assert.match(html, /Audit trail/);
  assert.doesNotMatch(html, /chatbot|chat with/i);
});
