import test from 'node:test';
import assert from 'node:assert/strict';
import { createHierarchyNode } from '../src/hierarchy-service.js';

test('creates a root hierarchy node with project scope', () => {
  const node = createHierarchyNode({ projectId: 'p1', existingNodes: [], payload: { code: '1', name: 'Engineering', level: 1 } });
  assert.deepEqual(node, { projectId: 'p1', parentId: null, code: '1', name: 'Engineering', level: 1 });
});

test('requires a same-project parent one level above the child', () => {
  const parent = { id: 'n1', projectId: 'p1', code: '1', level: 1 };
  const node = createHierarchyNode({ projectId: 'p1', existingNodes: [parent], payload: { parentId: 'n1', code: '1.1', name: 'Mechanical', level: 2 } });
  assert.equal(node.parentId, 'n1');
  assert.throws(() => createHierarchyNode({ projectId: 'p1', existingNodes: [parent], payload: { parentId: 'n1', code: '1.2', name: 'Wrong level', level: 3 } }), /level/i);
  assert.throws(() => createHierarchyNode({ projectId: 'p1', existingNodes: [{ ...parent, projectId: 'p2' }], payload: { parentId: 'n1', code: '1.1', name: 'Cross tenant', level: 2 } }), /project/i);
});

test('rejects duplicate codes in the same project', () => {
  assert.throws(() => createHierarchyNode({ projectId: 'p1', existingNodes: [{ projectId: 'p1', code: '1' }], payload: { code: '1', name: 'Duplicate', level: 1 } }), /already exists/i);
});
