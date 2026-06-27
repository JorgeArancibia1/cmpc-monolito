import { useQuery } from '@tanstack/react-query';
import { getAnalyticsSummary } from './api';

export function useAnalytics() {
  return useQuery({ queryKey: ['analytics'], queryFn: getAnalyticsSummary, staleTime: 60_000 });
}
