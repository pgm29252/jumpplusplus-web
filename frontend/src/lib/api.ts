const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export const api = {
  auth: {
    register: (body: { name: string; email: string; password: string }) =>
      request<{ success: boolean; token: string; user: User }>(
        "/api/auth/register",
        { method: "POST", body: JSON.stringify(body) },
      ),
    login: (body: { email: string; password: string }) =>
      request<{ success: boolean; token: string; user: User }>(
        "/api/auth/login",
        { method: "POST", body: JSON.stringify(body) },
      ),
    me: () => request<{ success: boolean; user: User }>("/api/auth/me"),
    logout: () =>
      request<{ success: boolean; message: string }>("/api/auth/logout", {
        method: "POST",
      }),
  },
  users: {
    list: () => request<{ success: boolean; users: User[] }>("/api/users"),
    stats: () =>
      request<{ success: boolean; stats: UserStats }>("/api/users/stats"),
    get: (id: string) =>
      request<{ success: boolean; user: User }>(`/api/users/${id}`),
    update: (id: string, body: Partial<User> & { password?: string }) =>
      request<{ success: boolean; user: User }>(`/api/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/api/users/${id}`, {
        method: "DELETE",
      }),
  },
};

export interface User {
  id: string;
  name: string;
  email: string;
  role: "USER" | "MODERATOR" | "ADMIN";
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface UserStats {
  total: number;
  admins: number;
  moderators: number;
  active: number;
}
