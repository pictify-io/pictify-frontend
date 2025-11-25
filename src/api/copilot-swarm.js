/**
 * Swarm Copilot API Client
 * Frontend API methods for interacting with swarm copilot
 */

import { PUBLIC_BACKEND_URL } from '$env/static/public';
import backend from '../service/backend';

const SWARM_BASE = '/copilot-swarm';

/**
 * Generate design using swarm copilot
 * @param {string} prompt - User's design prompt
 * @param {object} canvasState - Current canvas state
 * @param {object} options - Generation options (maxRefinements, targetScore)
 * @returns {Promise<object>} Generated design result
 */
export const generateSwarm = async (prompt, canvasState, options = {}) => {
  try {
    const response = await backend.post(`${SWARM_BASE}/generate`, {
      prompt,
      canvasState,
      options: {
        maxRefinements: options.maxRefinements || 2,
        targetScore: options.targetScore || 7
      }
    });
    return response;
  } catch (error) {
    console.error('Error in generateSwarm:', error);
    throw error;
  }
};

/**
 * Stream design generation using swarm copilot
 * @param {object} params - Generation parameters
 * @param {string} params.prompt - User's design prompt
 * @param {object} params.canvasState - Current canvas state
 * @param {object} params.options - Generation options
 * @param {function} params.onStep - Callback for step updates
 * @param {function} params.onComplete - Callback for completion
 * @param {function} params.onError - Callback for errors
 */
export const streamSwarmGenerate = async ({
  prompt,
  canvasState,
  options = {},
  onStep,
  onComplete,
  onError
}) => {
  const controller = new AbortController();
  const url = new URL(`${PUBLIC_BACKEND_URL}${SWARM_BASE}/generate-stream`);

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
        options: {
          maxRefinements: options.maxRefinements || 2,
          targetScore: options.targetScore || 7
        }
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
                // Step event contains { step, canvasState }
                onStep?.(parsed);
              } else if (eventName === 'complete') {
                onComplete?.(parsed);
              } else if (eventName === 'error') {
                onError?.(new Error(parsed.message || 'Unknown error'));
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
