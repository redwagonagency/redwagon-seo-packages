export type ReportProgressStatus = "RUNNING" | "COMPLETE" | "PARTIAL" | "FAILED";

export interface ReportProgress {
  projectId: string;
  snapshotId: string | null;
  status: ReportProgressStatus;
  phase: string;
  message: string;
  percent: number;
  crawledPages: number;
  targetPages: number;
  startedAt: string;
  updatedAt: string;
  errorMessage: string | null;
}

type ProgressStore = Map<string, ReportProgress>;

function getStore(): ProgressStore {
  const g = globalThis as typeof globalThis & { __reportProgressStore?: ProgressStore };
  if (!g.__reportProgressStore) {
    g.__reportProgressStore = new Map<string, ReportProgress>();
  }
  return g.__reportProgressStore;
}

function nowIso(): string {
  return new Date().toISOString();
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function startReportProgress(projectId: string, snapshotId: string | null): ReportProgress {
  const entry: ReportProgress = {
    projectId,
    snapshotId,
    status: "RUNNING",
    phase: "Queued",
    message: "Report queued",
    percent: 1,
    crawledPages: 0,
    targetPages: 0,
    startedAt: nowIso(),
    updatedAt: nowIso(),
    errorMessage: null,
  };
  const store = getStore();
  store.set(projectId, entry);
  return entry;
}

export function updateReportProgress(
  projectId: string,
  patch: Partial<Omit<ReportProgress, "projectId" | "startedAt">>
): ReportProgress | null {
  const store = getStore();
  const current = store.get(projectId);
  if (!current) return null;

  const merged: ReportProgress = {
    ...current,
    ...patch,
    percent: patch.percent == null ? current.percent : clampPercent(patch.percent),
    updatedAt: nowIso(),
  };

  store.set(projectId, merged);
  return merged;
}

export function finishReportProgress(
  projectId: string,
  status: Exclude<ReportProgressStatus, "RUNNING">,
  errorMessage: string | null
): ReportProgress | null {
  return updateReportProgress(projectId, {
    status,
    phase: status === "FAILED" ? "Failed" : "Completed",
    message:
      status === "COMPLETE"
        ? "Report completed"
        : status === "PARTIAL"
        ? "Report completed with partial results"
        : "Report failed",
    percent: 100,
    errorMessage,
  });
}

export function getReportProgress(projectId: string): ReportProgress | null {
  return getStore().get(projectId) ?? null;
}

export function isReportRunning(projectId: string): boolean {
  const current = getStore().get(projectId);
  return current?.status === "RUNNING";
}
