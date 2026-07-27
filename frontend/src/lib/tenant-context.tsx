"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { fetchApi } from "./api-client";
import { useAuthStore } from "./auth-store";

export type PmsType = "dentrix" | "open_dental" | "eaglesoft" | "other" | "none";

export interface TenantProfile {
  id: string;
  name: string;
  subdomain: string;
  is_active: boolean;
  phone_number: string | null;
  timezone: string;
  pms_type: PmsType;
  ai_enabled: boolean;
  logo_url: string | null;
}

interface TenantContextValue {
  tenant: TenantProfile | null;
  loading: boolean;
  refresh: () => Promise<void>;
  updateSettings: (data: Partial<TenantProfile>) => Promise<void>;
}

const TenantContext = createContext<TenantContextValue>({
  tenant: null,
  loading: false,
  refresh: async () => {},
  updateSettings: async () => {},
});

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const [tenant, setTenant] = useState<TenantProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchTenant = async () => {
    if (!user || user.role === "super_admin") return;
    setLoading(true);
    try {
      const data = await fetchApi<TenantProfile>("/clients/profile");
      setTenant(data);
    } catch {
      setTenant(null);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (data: Partial<TenantProfile>) => {
    const updated = await fetchApi<TenantProfile>("/clients/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    });
    setTenant(updated);
  };

  useEffect(() => {
    fetchTenant();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <TenantContext.Provider value={{ tenant, loading, refresh: fetchTenant, updateSettings }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  return useContext(TenantContext);
}
