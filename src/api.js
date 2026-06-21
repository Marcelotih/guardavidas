export const API_URL = 'http://localhost:8080';

function getHeaders() {
  const token = localStorage.getItem('token') || localStorage.getItem('tokenAdmin');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const headers = { ...getHeaders(), ...options.headers };

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(url, config);
  if (!response.ok) {
    let errorMsg = 'Ocorreu um erro no servidor.';
    try {
      const data = await response.json();
      errorMsg = data.message || errorMsg;
    } catch (_) {
      try {
        const text = await response.text();
        errorMsg = text || errorMsg;
      } catch (__) {}
    }
    throw new Error(errorMsg);
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

export const api = {
  get: (endpoint) => request(endpoint, { method: 'GET' }),
  post: (endpoint, body) => {
    const isFormData = body instanceof FormData;
    const headers = isFormData ? {} : { 'Content-Type': 'application/json' };
    return request(endpoint, {
      method: 'POST',
      headers,
      body: isFormData ? body : JSON.stringify(body),
    });
  },
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
};
