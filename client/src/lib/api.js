const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '');

export const API_BASE_URL = rawApiBaseUrl || '';

export const apiUrl = (path = '') => {
  if (!path) return API_BASE_URL || '';
  if (/^https?:\/\//i.test(path) || path.startsWith('data:') || path.startsWith('blob:')) {
    return path;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath;
};

export const apiFetch = (path, options = {}) =>
  fetch(apiUrl(path), {
    credentials: 'include',
    ...options,
  });

export const resolveAssetUrl = (value, folder, fallback = '') => {
  if (!value) return fallback ? apiUrl(fallback) : '';
  if (
    value.startsWith('data:') ||
    value.startsWith('blob:') ||
    value.startsWith('http://') ||
    value.startsWith('https://')
  ) {
    return value;
  }
  return apiUrl(`/static/${folder}/${value}`);
};
