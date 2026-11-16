const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1').replace(/\/$/, '');

export async function apiRequest(path, options = {}) {
  const { auth = true, headers = {}, ...requestOptions } = options;
  const token = localStorage.getItem('token');
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...requestOptions,
      headers: {
        ...(requestOptions.body ? { 'Content-Type': 'application/json' } : {}),
        ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch {
    throw new Error(`Não foi possível conectar à API em ${API_BASE}. Confira se o servidor está iniciado.`);
  }

  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(data?.error || `Falha na API (${response.status}).`);
    error.status = response.status;
    error.details = data?.details;
    throw error;
  }
  return data;
}

export const apiUrl = API_BASE;
