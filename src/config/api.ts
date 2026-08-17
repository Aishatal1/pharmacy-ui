// Uses a configured API URL when available, otherwise targets the local backend.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5103';

export default API_URL;
