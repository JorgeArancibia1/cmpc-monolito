import axios, { AxiosError, type AxiosRequestConfig } from 'axios';

const BASE_URL = `${import.meta.env.VITE_API_URL ?? 'http://localhost:3002'}/api`;

/** Token de acceso en memoria (no en localStorage → mitiga XSS). */
let accessToken: string | null = null;
export const setAccessToken = (token: string | null): void => {
  accessToken = token;
};
export const getAccessToken = (): string | null => accessToken;

export const api = axios.create({ baseURL: BASE_URL, withCredentials: true });

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

/** Lee el token CSRF (double-submit) que el backend dejó en una cookie legible. */
function getCsrfToken(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function refreshSession(): Promise<string | null> {
  try {
    const csrf = getCsrfToken();
    const { data } = await axios.post<{ data: { accessToken: string } }>(
      `${BASE_URL}/auth/refresh`,
      {},
      {
        withCredentials: true,
        headers: csrf ? { 'X-CSRF-Token': csrf } : undefined,
      },
    );
    setAccessToken(data.data.accessToken);
    return data.data.accessToken;
  } catch {
    setAccessToken(null);
    return null;
  }
}

let refreshing: Promise<string | null> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };
    const isAuthRoute = original?.url?.includes('/auth/');
    if (error.response?.status === 401 && original && !original._retry && !isAuthRoute) {
      original._retry = true;
      refreshing = refreshing ?? refreshSession();
      const token = await refreshing;
      refreshing = null;
      if (token) {
        original.headers = { ...original.headers, Authorization: `Bearer ${token}` };
        return api(original);
      }
    }
    return Promise.reject(error);
  },
);

export interface ApiError {
  message: string;
  code?: string;
  fields?: { field: string; message: string }[];
}

/** Extrae el error amigable que envía el backend (mensaje + errores por campo). */
export function getApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: ApiError } | undefined;
    if (data?.error?.message) {
      return data.error;
    }
  }
  return { message: 'Ocurrió un error. Por favor, inténtalo nuevamente.' };
}
