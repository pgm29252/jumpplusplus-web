"use client";
import { useState, useEffect, useCallback } from "react";
import {
  api,
  User,
  clearAuthToken,
  getAuthToken,
  setAuthToken,
} from "@/lib/api";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const data = await api.auth.me();
      setUser(data.user);
    } catch {
      clearAuthToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = async (email: string, password: string) => {
    const data = await api.auth.login({ email, password });
    setAuthToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (name: string, email: string, password: string) => {
    const data = await api.auth.register({ name, email, password });
    setAuthToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } finally {
      clearAuthToken();
      setUser(null);
    }
  };

  return { user, loading, login, register, logout, refetch: fetchMe };
}
