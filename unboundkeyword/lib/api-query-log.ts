import { prisma } from "@/lib/prisma";

export interface ApiQueryLogPayload {
  userId?: string | null;
  siteId?: string | null;
  provider: string;
  method: string;
  endpoint: string;
  queryKey?: string;
  useCase?: string | null;
  durationMs?: number | null;
  statusCode?: number | null;
  success: boolean;
  resultCount?: number | null;
  requestBody?: unknown;
  responseBody?: unknown;
  errorMessage?: string | null;
  taskIds?: string[];
}

function safeJsonStringify(value: unknown): string | null {
  if (value === undefined) return null;
  try {
    return JSON.stringify(value);
  } catch {
    return JSON.stringify({ _serializationError: true, type: typeof value });
  }
}

function normalizeTaskIds(value?: string[]): string | null {
  if (!value || value.length === 0) return null;
  return safeJsonStringify(Array.from(new Set(value.filter(Boolean))));
}

export async function logApiQuery(payload: ApiQueryLogPayload): Promise<void> {
  try {
    await prisma.apiQueryLog.create({
      data: {
        userId: payload.userId ?? null,
        siteId: payload.siteId ?? null,
        provider: payload.provider,
        method: payload.method,
        endpoint: payload.endpoint,
        queryKey: payload.queryKey ?? payload.endpoint,
        useCase: payload.useCase ?? "unknown",
        durationMs: payload.durationMs ?? null,
        statusCode: payload.statusCode ?? null,
        success: payload.success,
        resultCount: payload.resultCount ?? null,
        requestJson: safeJsonStringify(payload.requestBody),
        responseJson: safeJsonStringify(payload.responseBody),
        errorMessage: payload.errorMessage ?? null,
        taskIdsJson: normalizeTaskIds(payload.taskIds),
      },
    });
  } catch {
    // Never block request flow if logging fails.
  }
}
