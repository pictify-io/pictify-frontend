/**
 * Agentic Copilot API Client
 * Frontend API methods for interacting with agentic copilot
 */

import { PUBLIC_BACKEND_URL } from '$env/static/public';
import backend from '../service/backend';

const AGENTIC_BASE = '/copilot-agentic';

export const generateAgentic = async (prompt, canvasState, conversationHistory = [], options = {}) => {
  try {
    const response = await backend.post(`${AGENTIC_BASE}/generate`, {
      prompt,
      canvasState,
      conversationHistory,
      selfCorrect: options.selfCorrect !== false,
      autoApprove: options.autoApprove || false
    });
    return response;
  } catch (error) {
    console.error('Error in generateAgentic:', error);
    throw error;
  }
};

export const streamAgenticGenerate = async ({
  prompt,
  canvasState,
  conversationHistory = [],
  options = {},
  onStep,
  onComplete,
  onError
}) => {
  const controller = new AbortController();
  const url = new URL(`${PUBLIC_BACKEND_URL}${AGENTIC_BASE}/generate`);
  url.searchParams.set('stream', 'true');

  try {
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream'
      },
      body: JSON.stringify({
        prompt,
        canvasState,
        conversationHistory,
        selfCorrect: options.selfCorrect !== false,
        autoApprove: options.autoApprove || false
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Failed to start copilot: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/event-stream')) {
      const payload = await response.json();
      onComplete?.(payload);
      return { abort: () => controller.abort() };
    }

    if (!response.body) {
      throw new Error('Streaming not supported in this browser.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    const processBuffer = () => {
      let boundary = buffer.indexOf('\n\n');
      while (boundary !== -1) {
        const chunk = buffer.slice(0, boundary).trim();
        buffer = buffer.slice(boundary + 2);
        if (chunk.length > 0) {
          let eventName = 'message';
          let dataPayload = '';
          chunk.split('\n').forEach(line => {
            if (line.startsWith('event:')) {
              eventName = line.slice(6).trim();
            } else if (line.startsWith('data:')) {
              dataPayload += line.slice(5).trim();
            }
          });

          if (dataPayload) {
            try {
              const parsed = JSON.parse(dataPayload);
              if (eventName === 'step') {
                onStep?.(parsed);
              } else if (eventName === 'complete') {
                onComplete?.(parsed);
              }
            } catch (error) {
              console.warn('Failed to parse SSE payload', error);
            }
          }
        }
        boundary = buffer.indexOf('\n\n');
      }
    };

    (async () => {
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          processBuffer();
        }
        if (buffer.trim().length > 0) {
          processBuffer();
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        console.error('Copilot stream error:', error);
        onError?.(error);
      }
    })();

    return {
      abort: () => controller.abort()
    };
  } catch (error) {
    controller.abort();
    console.error('Error starting copilot stream:', error);
    onError?.(error);
    throw error;
  }
};

export const approveStep = async ({ stepId, threadId }) => {
  if (!stepId) {
    throw new Error('Missing stepId for approval');
  }
  try {
    const response = await backend.post(`${AGENTIC_BASE}/execute-step`, {
      stepId,
      approved: true,
      threadId
    });
    return response;
  } catch (error) {
    console.error('Error approving step:', error);
    throw error;
  }
};

export const rejectStep = async ({
  stepId,
  threadId,
  feedback,
  canvasState,
  conversationHistory = [],
  prompt
}) => {
  if (!stepId) {
    throw new Error('Missing stepId for rejection');
  }
  try {
    const response = await backend.post(`${AGENTIC_BASE}/execute-step`, {
      stepId,
      approved: false,
      feedback,
      threadId,
      canvasState,
      conversationHistory,
      prompt
    });
    return response;
  } catch (error) {
    console.error('Error rejecting step:', error);
    throw error;
  }
};
