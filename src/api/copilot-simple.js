/**
 * Simple Copilot API Client (V3)
 * Frontend API methods for interacting with simplified copilot
 */

import { PUBLIC_BACKEND_URL } from '$env/static/public';
import backend from '../service/backend';

const BASE_PATH = '/copilot-simple';

/**
 * Generate design using simplified copilot
 * @param {string} prompt - User's design prompt
 * @param {object} canvasState - Current canvas state
 * @param {object} brandAssets - User's brand assets (colors, fonts, logos)
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @returns {Promise<object>} Generated design result
 */
export const generateSimple = async (prompt, canvasState, brandAssets = null, width = 1080, height = 1080) => {
  try {
    const response = await backend.post(`${BASE_PATH}/generate`, {
      prompt,
      canvasState,
      brandAssets,
      width,
      height
    });
    return response;
  } catch (error) {
    console.error('Error in generateSimple:', error);
    throw error;
  }
};

/**
 * Stream design generation using simplified copilot
 * @param {object} params - Generation parameters
 * @param {string} params.prompt - User's design prompt
 * @param {object} params.canvasState - Current canvas state
 * @param {object} params.brandAssets - User's brand assets (colors, fonts, logos)
 * @param {number} params.width - Canvas width
 * @param {number} params.height - Canvas height
 * @param {function} params.onStep - Callback for step updates
 * @param {function} params.onComplete - Callback for completion
 * @param {function} params.onError - Callback for errors
 */
export const streamSimpleGenerate = async ({
  prompt,
  canvasState,
  brandAssets = null,
  width = 1080,
  height = 1080,
  onStep,
  onComplete,
  onError
}) => {
  const controller = new AbortController();
  const url = new URL(`${PUBLIC_BACKEND_URL}${BASE_PATH}/generate-stream`);

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
        brandAssets,
        width,
        height
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Failed to start copilot: ${response.statusText}`);
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
