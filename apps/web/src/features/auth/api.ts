import type { AuthUser, LoginInput } from '@cmpc/contracts';
import { api, setAccessToken } from '@/lib/api';

export async function loginRequest(credentials: LoginInput): Promise<AuthUser> {
  const { data } = await api.post<{ data: { user: AuthUser; accessToken: string } }>(
    '/auth/login',
    credentials,
  );
  setAccessToken(data.data.accessToken);
  return data.data.user;
}

export async function fetchMe(): Promise<AuthUser> {
  const { data } = await api.get<{ data: AuthUser }>('/auth/me');
  return data.data;
}

export async function logoutRequest(): Promise<void> {
  await api.post('/auth/logout');
  setAccessToken(null);
}
