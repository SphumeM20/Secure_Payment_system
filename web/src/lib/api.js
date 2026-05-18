const API_BASE = 'https://localhost:5001';
const CSRF_KEY = 'secure-payments-csrf';

export function setCsrfToken(token) {
  sessionStorage.setItem(CSRF_KEY, token);
}

export function getCsrfToken() {
  return sessionStorage.getItem(CSRF_KEY);
}

export function clearCsrfToken() {
  sessionStorage.removeItem(CSRF_KEY);
}

export async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (!options.skipCsrf && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method || 'GET')) {
    const token = getCsrfToken();
    if (token) headers['x-csrf-token'] = token;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method || 'GET',
    headers,
    credentials: 'include',
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : {};
  if (!response.ok) {
    throw new Error(data.message || 'Request failed.');
  }
  return data;
}
