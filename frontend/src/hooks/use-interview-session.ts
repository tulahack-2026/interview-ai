export const interviewQueryKeys = {
  list: (offset: number, limit: number) => ["interviews", { offset, limit }] as const,
  detail: (sessionId: number) => ["interview", sessionId] as const,
  report: (sessionId: number) => ["interview-report", sessionId] as const,
  progressSummary: ["progress", "summary"] as const,
};
