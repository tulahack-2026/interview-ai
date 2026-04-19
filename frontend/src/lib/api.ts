import type { components } from "@/types/api";
import { apiClient, authApiClient } from "@/lib/api-client";

type UserCreate = components["schemas"]["UserCreate"];
type UserResponse = components["schemas"]["UserResponse"];
type RefreshAccessToken = components["schemas"]["RefreshAccessToken"];
type InterviewCreate = components["schemas"]["InterviewCreate"];
type InterviewCreateResponse = components["schemas"]["InterviewCreateResponse"];
type InterviewMessageCreate = components["schemas"]["InterviewMessageCreate"];
type InterviewReplyResponse = components["schemas"]["InterviewReplyResponse"];
type InterviewReportOut = components["schemas"]["InterviewReportOut"];
type InterviewDetailResponse = components["schemas"]["InterviewDetailResponse"];
type InterviewListResponse = components["schemas"]["InterviewListResponse"];
type ProgressSummaryResponse = components["schemas"]["ProgressSummaryResponse"];

export async function registerUser(body: UserCreate): Promise<RefreshAccessToken> {
  const { data } = await apiClient.post<RefreshAccessToken>("/user/register", body);
  return data;
}

export async function loginWithPassword(
  username: string,
  password: string
): Promise<RefreshAccessToken> {
  const body = new URLSearchParams();
  body.set("username", username);
  body.set("password", password);
  const { data } = await authApiClient.post<RefreshAccessToken>("/user/token", body, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return data;
}

export async function fetchCurrentUser(): Promise<UserResponse> {
  const { data } = await apiClient.get<UserResponse>("/user/self");
  return data;
}

export async function createInterview(body: InterviewCreate): Promise<InterviewCreateResponse> {
  const { data } = await apiClient.post<InterviewCreateResponse>("/interviews", body);
  return data;
}

export async function postInterviewMessage(
  sessionId: number,
  body: InterviewMessageCreate
): Promise<InterviewReplyResponse> {
  const { data } = await apiClient.post<InterviewReplyResponse>(
    `/interviews/${sessionId}/messages`,
    body
  );
  return data;
}

export async function completeInterview(sessionId: number): Promise<InterviewReportOut> {
  const { data } = await apiClient.post<InterviewReportOut>(
    `/interviews/${sessionId}/complete`
  );
  return data;
}

export async function getInterview(sessionId: number): Promise<InterviewDetailResponse> {
  const { data } = await apiClient.get<InterviewDetailResponse>(`/interviews/${sessionId}`);
  return data;
}

export async function listInterviews(
  offset = 0,
  limit = 20
): Promise<InterviewListResponse> {
  const { data } = await apiClient.get<InterviewListResponse>("/interviews", {
    params: { offset, limit },
  });
  return data;
}

export async function getProgressSummary(): Promise<ProgressSummaryResponse> {
  const { data } = await apiClient.get<ProgressSummaryResponse>(
    "/interviews/progress/summary"
  );
  return data;
}
