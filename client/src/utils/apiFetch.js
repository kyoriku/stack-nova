export const apiFetch = async (path, options = {}) => {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.message || 'Request failed');
    error.status = response.status;
    error.code = errorData.code;
    error.response = { data: errorData, status: response.status };
    throw error;
  }

  return response.json();
};