import { AsyncLocalStorage } from "node:async_hooks";

export interface ApiUsageContext {
  userId?: string | null;
  siteId?: string | null;
  useCase?: string | null;
}

const apiUsageStorage = new AsyncLocalStorage<ApiUsageContext>();

export async function runWithApiUsageUserContext<T>(
  userId: string | null | undefined,
  fn: () => Promise<T>,
  metadata?: Omit<ApiUsageContext, "userId">
): Promise<T> {
  return apiUsageStorage.run({ userId: userId ?? null, ...metadata }, fn);
}

export function getApiUsageUserId(): string | null {
  const store = apiUsageStorage.getStore();
  return store?.userId ?? null;
}

export function getApiUsageContext(): ApiUsageContext {
  return apiUsageStorage.getStore() ?? { userId: null, siteId: null, useCase: null };
}
