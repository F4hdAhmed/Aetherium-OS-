import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_PREFERENCES,
  addRecentWorkspace,
  normalizePreferences,
} from '../dist-electron/src/state/preferences.js';

test('normalizePreferences safely falls back for malformed data', () => {
  assert.deepEqual(normalizePreferences(null), DEFAULT_PREFERENCES);
  assert.deepEqual(normalizePreferences({ theme: 'unknown', recentWorkspaces: 'invalid' }), DEFAULT_PREFERENCES);
});

test('normalizePreferences retains only valid recent workspaces', () => {
  const result = normalizePreferences({
    theme: 'light',
    restoreLastWorkspace: 1,
    recentWorkspaces: [
      { name: 'Aetherium', path: 'C:\\Projects\\Aetherium', openedAt: 42 },
      { name: 'Broken', openedAt: 8 },
    ],
  });
  assert.equal(result.theme, 'light');
  assert.equal(result.restoreLastWorkspace, true);
  assert.equal(result.recentWorkspaces.length, 1);
});

test('addRecentWorkspace moves an existing workspace to the front without duplicates', () => {
  const preferences = {
    ...DEFAULT_PREFERENCES,
    recentWorkspaces: [
      { name: 'One', path: 'C:\\One', openedAt: 1 },
      { name: 'Two', path: 'C:\\Two', openedAt: 2 },
    ],
  };
  const result = addRecentWorkspace(preferences, { name: 'One', path: 'C:\\One' }, 10);
  assert.deepEqual(result.recentWorkspaces.map(({ name, openedAt }) => ({ name, openedAt })), [
    { name: 'One', openedAt: 10 },
    { name: 'Two', openedAt: 2 },
  ]);
});

test('normalizePreferences migrates legacy AI settings to Gemini', () => {
  const migrated = normalizePreferences({
    ai: { provider: 'openai', model: 'gpt-5.4', endpoint: 'https://api.openai.com/v1' },
  });
  assert.deepEqual(migrated.ai, DEFAULT_PREFERENCES.ai);

  const retained = normalizePreferences({
    ai: { provider: 'gemini', model: 'gemini-custom', endpoint: 'https://example.invalid' },
  });
  assert.equal(retained.ai.model, 'gemini-custom');
  assert.equal(retained.ai.endpoint, DEFAULT_PREFERENCES.ai.endpoint);

  const previousDefault = normalizePreferences({
    ai: { provider: 'gemini', model: 'gemini-3.7-flash', endpoint: DEFAULT_PREFERENCES.ai.endpoint },
  });
  assert.equal(previousDefault.ai.model, 'gemini-3.5-flash');
});
