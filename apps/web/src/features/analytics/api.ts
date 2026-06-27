import type { AnalyticsSummary } from '@cmpc/contracts';
import { api } from '@/lib/api';

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const { data } = await api.get<{ data: AnalyticsSummary }>('/analytics/summary');
  return data.data;
}
