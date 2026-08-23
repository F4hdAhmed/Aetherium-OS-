import assert from 'node:assert/strict';
import test from 'node:test';
import { parseGeminiInteractionEvent } from '../dist-electron/electron/services/ai-service.js';

test('parses Gemini Interactions API text deltas', () => {
  assert.deepEqual(
    parseGeminiInteractionEvent('{"event_type":"step.delta","delta":{"type":"text","text":"hello"}}'),
    { type: 'token', value: 'hello' },
  );
});

test('parses Gemini Interactions API errors and ignores metadata', () => {
  assert.deepEqual(
    parseGeminiInteractionEvent('{"event_type":"error","error":{"message":"model unavailable"}}'),
    { type: 'error', value: 'model unavailable' },
  );
  assert.equal(parseGeminiInteractionEvent('{"event_type":"interaction.start"}'), null);
  assert.equal(parseGeminiInteractionEvent('not-json'), null);
});
