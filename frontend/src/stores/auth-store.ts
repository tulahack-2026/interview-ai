import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { components } from "@/types/api";
import { setAuthTokens } from "@/lib/auth-tokens";
import {
  fetchCurrentUser,
  loginWithPassword,
  registerUser,
} from "@/lib/api";

type UserResponse = components["schemas"]["UserResponse"];
type UserCreate = components["schemas"]["UserCreate"];

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserResponse | null;
  login: (email: string, password: string) => Promise<void>;
  register: (body: UserCreate) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  syncTokensFromInterceptor: (access: string, refresh: string) => void;
  clearSessionFromInterceptor: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,

      syncTokensFromInterceptor: (access, refresh) => {
        set({ accessToken: access, refreshToken: refresh });
        setAuthTokens(access, refresh);
      },

      clearSessionFromInterceptor: () => {
        set({ accessToken: null, refreshToken: null, user: null });
        setAuthTokens(null, null);
      },

      login: async (email, password) => {
        const data = await loginWithPassword(email, password);
        set({
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
        });
        setAuthTokens(data.access_token, data.refresh_token);
        const user = await fetchCurrentUser();
        set({ user });
      },

      register: async (body) => {
        const data = await registerUser(body);
        set({
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
        });
        setAuthTokens(data.access_token, data.refresh_token);
        const user = await fetchCurrentUser();
        set({ user });
      },

      logout: () => {
        set({ accessToken: null, refreshToken: null, user: null });
        setAuthTokens(null, null);
      },

      fetchUser: async () => {
        if (!get().accessToken) return;
        const user = await fetchCurrentUser();
        set({ user });
      },
    }),
    {
      name: "interview-coach-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        if (state) {
          setAuthTokens(state.accessToken, state.refreshToken);
        }
      },
    }
  )
);

useAuthStore.subscribe((state) => {
  setAuthTokens(state.accessToken, state.refreshToken);
});

setAuthTokens(
  useAuthStore.getState().accessToken,
  useAuthStore.getState().refreshToken
);
