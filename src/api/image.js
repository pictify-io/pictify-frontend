import backend from '../service/backend';
import { PUBLIC_BACKEND_URL } from '$env/static/public';

const createImagePublic = async ({ html, width, height, selector, url, fileExtension }) => {
	const response = await backend.post('/image/public', {
		html,
		width,
		height,
		selector,
		url,
		fileExtension
	});
	return response;
};

const createGifPublic = async ({ html, width, height, duration }) => {
	const response = await backend.post('/gif/public', {
		html,
		width,
		height,
		duration
	});
	return response;
};

const createOgImage = async ({ template, heading, description, logo, apiKey }) => {
	const headers = apiKey ? { Authorization: `Bearer ${apiKey}` } : {};
	const response = await backend.post('/image/og-image', {
		template,
		heading,
		description,
		logo
	}, { headers });
	return response;
};

const createImage = async ({ html, width, height, selector, url, fileExtension, apiKey }) => {
	const headers = apiKey ? { Authorization: `Bearer ${apiKey}` } : {};
	const response = await backend.post('/image', {
		html,
		width,
		height,
		selector,
		url,
		fileExtension
	}, { headers });
	return response;
};

const createGif = async ({ html, width, height, framesPerSecond, selector, apiKey }) => {
	const headers = apiKey ? { Authorization: `Bearer ${apiKey}` } : {};
	const response = await backend.post('/gif', {
		html,
		width,
		height,
		framesPerSecond,
		selector
	}, { headers });
	return response;
};

const createAgentScreenshot = async ({ prompt, apiKey }) => {
	const headers = apiKey ? { Authorization: `Bearer ${apiKey}` } : {};
	const response = await backend.post('/image/agent-screenshot', {
		prompt
	}, { headers });
	return response;
};

const getOgImageTemplates = async (apiKey) => {
	const config = apiKey ? { headers: { Authorization: `Bearer ${apiKey}` } } : {};
	const response = await backend.get('/templates/type/og-image', config);
	return response;
};

const checkApiHealth = async () => {
	try {
		await backend.get('/healthcheck');
		return true;
	} catch (error) {
		return false;
	}
};

// Agent Screenshot Stream API
const createAgentScreenshotStream = async (prompt, onMessage, apiKey) => {
	try {
		const apiUrl = new URL(`${PUBLIC_BACKEND_URL}/image/agent-screenshot-stream`);

		// Add API token as query parameter for SSE compatibility
		if (apiKey) {
			apiUrl.searchParams.append('token', apiKey);
		}

		console.log('Making request to:', apiUrl.toString());

		const response = await fetch(apiUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ prompt })
		});

		console.log('Response status:', response.status);
		console.log('Response headers:', Object.fromEntries(response.headers.entries()));

		if (!response.ok) {
			let errorMessage = `HTTP error! status: ${response.status}`;

			// Try to get error details from response
			try {
				const errorText = await response.text();
				console.error('Error response body:', errorText);

				// Try to parse as JSON
				try {
					const errorData = JSON.parse(errorText);
					errorMessage += ` - ${errorData.message || errorData.error || 'Unknown error'}`;
				} catch (e) {
					errorMessage += ` - ${errorText}`;
				}
			} catch (e) {
				console.error('Could not read error response:', e);
			}

			throw new Error(errorMessage);
		}

		// Check if the response is actually a stream
		if (!response.body) {
			throw new Error('Response body is null - streaming not supported');
		}

		const reader = response.body.getReader();
		const decoder = new TextDecoder();

		let buffer = '';

		try {
			while (true) {
				const { done, value } = await reader.read();

				if (done) {
					console.log('Stream ended');
					break;
				}

				buffer += decoder.decode(value, { stream: true });

				// Process complete lines
				const lines = buffer.split('\n');
				buffer = lines.pop() || ''; // Keep the last incomplete line in buffer

				for (const line of lines) {
					if (line.trim() === '') continue;

					if (line.startsWith('data: ')) {
						const data = line.slice(6);
						if (data === '[DONE]') {
							return;
						}

						try {
							const parsed = JSON.parse(data);
							onMessage(parsed);
						} catch (e) {
							console.error('Error parsing SSE data:', e, 'Raw data:', data);
						}
					}
				}
			}
		} finally {
			reader.releaseLock();
		}
	} catch (error) {
		console.error('createAgentScreenshotStream error:', error);
		throw error;
	}
};

export {
	createGifPublic,
	createImagePublic,
	createOgImage,
	getOgImageTemplates,
	checkApiHealth,
	createAgentScreenshotStream,
	createImage,
	createGif,
	createAgentScreenshot
};
