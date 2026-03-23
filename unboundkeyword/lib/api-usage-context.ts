import { AsyncLocalStorage } from "node:async_hooks";

const apiUsageStorage = new AsyncLocalStorage<{ userId?: string | null }>();

export async function runWithApiUsageUserContext<T>(userId: string | null | undefined, fn: () => Promise<T>): Promise<T> {
  return apiUsageStorage.run({ userId: userId ?? null }, fn);
}

export function getApiUsageUserId(): string | null {
  const store = apiUsageStorage.getStore();
  return store?.userId ?? null;
}
