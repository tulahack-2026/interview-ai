/** Mutable token refs for axios interceptors (avoids circular imports with the auth store). */
export const authTokens = {
  accessToken: null as string | null,
  refreshToken: null as string | null,
};

export function setAuthTokens(access: string | null, refresh: string | null) {
  authTokens.accessToken = access;
  authTokens.refreshToken = refresh;
}
