import axios from 'axios';
import { PUBLIC_BACKEND_URL } from '$env/static/public';

const backend = axios.create({
	baseURL: PUBLIC_BACKEND_URL,
	withCredentials: true,
	headers: {
		'Content-Type': 'application/json'
	}
});

export default backend;
