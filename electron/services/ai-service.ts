import type { AIRequest, AIStreamEvent } from '../../src/types/contracts.js';

type ParsedGeminiEvent = Pick<AIStreamEvent, 'type' | 'value'> | null;

export function parseGeminiInteractionEvent(data: string): ParsedGeminiEvent {
  if (!data || data === '[DONE]') return null;
  try {
    const event = JSON.parse(data) as {
      event_type?: string;
      eventType?: string;
      delta?: { type?: string; text?: unknown };
      error?: { message?: unknown };
    };
    const eventType = event.event_type ?? event.eventType;
    if (eventType === 'step.delta' && event.delta?.type === 'text' && typeof event.delta.text === 'string') {
      return { type: 'token', value: event.delta.text };
    }
    if (eventType === 'error' || event.error) {
      return {
        type: 'error',
        value: typeof event.error?.message === 'string' ? event.error.message : 'The Gemini response failed.',
      };
    }
  } catch {
    return null;
  }
  return null;
}

export class AIService {
  private requests = new Map<string, AbortController>();
  onEvent?: (event: AIStreamEvent) => void;

  status() {
    return {
      configured: Boolean(process.env.GEMINI_API_KEY),
      credentialSource: 'GEMINI_API_KEY environment variable',
    };
  }

  async stream(request: AIRequest) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      this.onEvent?.({ requestId: request.requestId, type: 'error', value: 'Set GEMINI_API_KEY before starting Aetherium to use Aether AI.' });
      return;
    }

    const controller = new AbortController();
    this.requests.set(request.requestId, controller);
    const context = this.contextMessage(request);
    const transcript = request.messages
      .filter((message) => message.role !== 'system')
      .map((message) => (message.role === 'assistant' ? 'Aether' : 'User') + ':\n' + message.content)
      .join('\n\n');
    let streamFailed = false;

    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions?alt=sse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          model: request.model,
          stream: true,
          store: false,
          system_instruction: [
            'You are Aether, the expert coding intelligence inside Aetherium OS. Be accurate, concise, and security-conscious. You cannot change files directly. When the user explicitly asks you to create or modify project files, you may propose a reviewable file plan by ending your response with exactly one fenced aetherium-files block containing valid JSON in this shape: {"files":[{"path":"relative/project/path.ext","content":"complete file content"}]}. Include complete content, use workspace-relative paths, never target .git, node_modules, build, dist, release, secrets, or binary files, and keep plans to at most 20 files. Clearly say the plan is not applied until the user approves it in Aetherium. Do not emit a file plan for explanations or ordinary advice.',
            context,
          ].filter(Boolean).join('\n\n'),
          input: transcript,
        }),
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error('Gemini returned ' + response.status + ': ' + (await response.text()).slice(0, 500));
      }
      if (!response.body) throw new Error('Gemini did not return a response stream.');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let pending = '';
      const handleLine = (line: string) => {
        if (!line.startsWith('data:')) return;
        const parsed = parseGeminiInteractionEvent(line.slice(5).trim());
        if (!parsed) return;
        if (parsed.type === 'error') streamFailed = true;
        this.onEvent?.({ requestId: request.requestId, ...parsed });
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        pending += decoder.decode(value, { stream: true });
        const lines = pending.split(/\r?\n/);
        pending = lines.pop() ?? '';
        lines.forEach(handleLine);
      }
      pending += decoder.decode();
      if (pending) handleLine(pending);
      if (!streamFailed) this.onEvent?.({ requestId: request.requestId, type: 'done' });
    } catch (error) {
      if (controller.signal.aborted) {
        this.onEvent?.({ requestId: request.requestId, type: 'done' });
      } else {
        const message = error instanceof Error ? error.message : String(error);
        this.onEvent?.({ requestId: request.requestId, type: 'error', value: message });
      }
    } finally {
      this.requests.delete(request.requestId);
    }
  }

  cancel(requestId: string) {
    this.requests.get(requestId)?.abort();
  }

  private contextMessage(request: AIRequest) {
    const sections: string[] = ['The user explicitly chose to share this bounded editor context:'];
    if (request.context.activeFile) {
      sections.push('Active file: ' + request.context.activeFile.path + '\n--- BEGIN FILE ---\n' + request.context.activeFile.content.slice(0, 30000) + '\n--- END FILE ---');
    }
    if (request.context.selectedCode) {
      sections.push('Selected code:\n--- BEGIN SELECTION ---\n' + request.context.selectedCode.slice(0, 12000) + '\n--- END SELECTION ---');
    }
    if (request.context.projectFiles?.length) {
      sections.push('Project files (names only):\n' + request.context.projectFiles.slice(0, 500).join('\n'));
    }
    if (request.context.terminalOutput) {
      sections.push('Recent terminal output:\n' + request.context.terminalOutput.slice(-8000));
    }
    return sections.length > 1 ? sections.join('\n\n') : '';
  }
}
