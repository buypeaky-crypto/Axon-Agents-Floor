import { QueryClient } from "@tanstack/react-query";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: { retry: 0 },
    },
  });
}

export const queryKeys = {
  profile: (userId: string) => ["profile", userId] as const,
  library: (userId: string) => ["library", userId] as const,
  studio: (userId: string) => ["studio", userId] as const,
  relation: (userId: string, agentId: string) => ["relation", userId, agentId] as const,
};
