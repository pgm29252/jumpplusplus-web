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
  events: {
    list: () => request<{ success: boolean; events: Event[] }>("/api/events"),
    listAll: () =>
      request<{ success: boolean; events: Event[] }>("/api/events/admin/all"),
    get: (id: string) =>
      request<{ success: boolean; event: Event }>(`/api/events/${id}`),
    create: (body: {
      title: string;
      description?: string;
      duration?: number;
      price?: number;
      maxSlots?: number;
    }) =>
      request<{ success: boolean; event: Event }>("/api/events", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    update: (id: string, body: Partial<Omit<Event, "id" | "createdAt">>) =>
      request<{ success: boolean; event: Event }>(`/api/events/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    delete: (id: string) =>
      request<{ success: boolean; message: string }>(`/api/events/${id}`, {
        method: "DELETE",
      }),
    restore: (id: string) =>
      request<{ success: boolean; message: string }>(
        `/api/events/${id}/restore`,
        { method: "PATCH" },
      ),
  },
  bookings: {
    list: () =>
      request<{ success: boolean; bookings: Booking[] }>("/api/bookings"),
    listAll: () =>
      request<{ success: boolean; bookings: Booking[] }>(
        "/api/bookings/admin/all",
      ),
    get: (id: string) =>
      request<{ success: boolean; booking: Booking }>(`/api/bookings/${id}`),
    create: (body: { eventId: string; startTime: string; notes?: string }) =>
      request<{ success: boolean; booking: Booking }>("/api/bookings", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    cancel: (id: string) =>
      request<{ success: boolean; booking: Booking }>(
        `/api/bookings/${id}/cancel`,
        {
          method: "PATCH",
        },
      ),
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

export interface Event {
  id: string;
  title: string;
  description?: string;
  duration: number;
  price: number;
  maxSlots: number;
  isActive?: boolean;
  createdAt: string;
  createdBy?: { id: string; name: string; email?: string };
  bookings?: Booking[];
  _count?: { bookings: number };
}

export interface Booking {
  id: string;
  eventId: string;
  userId?: string;
  startTime: string;
  endTime: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  notes?: string;
  createdAt: string;
  event: { id: string; title: string; duration: number; price: number };
  user?: { id: string; name: string; email: string };
}
