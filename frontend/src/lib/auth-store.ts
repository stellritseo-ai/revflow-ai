import { create } from "zustand";
import { fetchApi } from "./api-client";

export type UserRole = 
  | "super_admin" 
  | "clinic_owner" 
  | "receptionist" 
  | "doctor" 
  | "office_manager"
  | "marketing" 
  | "billing"
  | "viewer";

export interface UserSession {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: UserRole;
  client_id?: string;
  client_name?: string;
}

interface AuthState {
  user: UserSession | null;
  token: string | null;
  loading: boolean;
  initialized: boolean;
  
  initialize: () => void;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  loginDev: (email: string, role: UserRole) => Promise<void>;
  registerClinic: (payload: any) => Promise<any>;
  verifyEmail: (token: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<any>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  loading: false,
  initialized: false,


  initialize: () => {
    if (typeof window === "undefined" || get().initialized) return;
    
    const savedToken = localStorage.getItem("revflow_token");
    const savedUser = localStorage.getItem("revflow_user");
    
    if (savedToken && savedUser) {
      set({
        token: savedToken,
        user: JSON.parse(savedUser),
        initialized: true,
      });
    } else {
      set({ initialized: true });
    }
  },

  login: async (email: string, password: string, rememberMe: boolean = false) => {
    set({ loading: true });
    try {
      const response = await fetchApi<{
        access_token: string;
        user: UserSession;
      }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password, remember_me: rememberMe }),
      });

      const { access_token, user } = response;
      
      localStorage.setItem("revflow_token", access_token);
      localStorage.setItem("revflow_user", JSON.stringify(user));
      
      set({ token: access_token, user, loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  loginDev: async (email: string, role: UserRole) => {
    set({ loading: true });
    try {
      const response = await fetchApi<{
        access_token: string;
        user: UserSession;
      }>("/auth/login-dev", {
        method: "POST",
        body: JSON.stringify({ email, role }),
      });

      const { access_token, user } = response;
      
      localStorage.setItem("revflow_token", access_token);
      localStorage.setItem("revflow_user", JSON.stringify(user));
      
      set({ token: access_token, user, loading: false });
    } catch (err) {
      console.warn("Backend API offline or restricted — activating instant local dev session", err);
      const mockToken = `mock_dev_token_${Date.now()}`;
      const nameParts = (email || role).split("@")[0].split("_");
      const firstName = nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1);
      const lastName = nameParts[1] ? nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1) : "User";

      const mockUser: UserSession = {
        id: `usr_${role}_dev`,
        email: email || `${role}@practice.com`,
        first_name: firstName,
        last_name: lastName,
        role: role,
        client_id: role === "super_admin" ? undefined : "client_dev_practice",
        client_name: "Development Practice",
      };

      localStorage.setItem("revflow_token", mockToken);
      localStorage.setItem("revflow_user", JSON.stringify(mockUser));

      set({ token: mockToken, user: mockUser, loading: false });
    }
  },

  registerClinic: async (payload: any) => {
    set({ loading: true });
    try {
      const res = await fetchApi<any>("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      set({ loading: false });
      return res;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  verifyEmail: async (token: string) => {
    set({ loading: true });
    try {
      await fetchApi("/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      set({ loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  forgotPassword: async (email: string) => {
    set({ loading: true });
    try {
      const res = await fetchApi("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      set({ loading: false });
      return res;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  resetPassword: async (token: string, newPassword: string) => {
    set({ loading: true });
    try {
      await fetchApi("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, new_password: newPassword }),
      });
      set({ loading: false });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },


  logout: () => {
    localStorage.removeItem("revflow_token");
    localStorage.removeItem("revflow_user");
    set({ token: null, user: null });
  },
}));
