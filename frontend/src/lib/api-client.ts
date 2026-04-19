import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { components } from "@/types/api";
import { authTokens, setAuthTokens } from "@/lib/auth-tokens";

type RefreshResponse = components["schemas"]["RefreshAccessToken"];

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "";

export const apiClient = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

/** Plain client for auth endpoints (no Bearer, no 401 refresh loop). */
export const authApiClient = axios.create({
  baseURL,
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const rt = authTokens.refreshToken;
  if (!rt) return null;

  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const body = new URLSearchParams();
      body.set("refresh_token", rt);
      const { data } = await authApiClient.post<RefreshResponse>("/user/refresh", body, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      setAuthTokens(data.access_token, data.refresh_token);
      const { useAuthStore } = await import("@/stores/auth-store");
      useAuthStore.getState().syncTokensFromInterceptor(data.access_token, data.refresh_token);
      return data.access_token;
    } catch {
      setAuthTokens(null, null);
      const { useAuthStore } = await import("@/stores/auth-store");
      useAuthStore.getState().clearSessionFromInterceptor();
      if (typeof window !== "undefined") {
        window.location.assign("/login");
      }
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = authTokens.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status !== 401 || !original || original._retry) {
      return Promise.reject(error);
    }
    if (original.url?.includes("/user/refresh") || original.url?.includes("/user/token")) {
      return Promise.reject(error);
    }

    original._retry = true;
    const newAccess = await refreshAccessToken();
    if (!newAccess) {
      return Promise.reject(error);
    }
    original.headers.Authorization = `Bearer ${newAccess}`;
    return apiClient(original);
  }
);
