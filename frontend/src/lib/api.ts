const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function readTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;

  const tokenCookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("token="));

  if (!tokenCookie) return null;

  const raw = tokenCookie.slice("token=".length);
  if (!raw) return null;

  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export function setAuthToken(token: string) {
  if (typeof window === "undefined") return;

  localStorage.setItem("token", token);
  document.cookie = `token=${encodeURIComponent(token)}; path=/; max-age=${AUTH_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function clearAuthToken() {
  if (typeof window === "undefined") return;

  localStorage.removeItem("token");
  document.cookie = "token=; path=/; max-age=0; SameSite=Lax";
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;

  const localToken = localStorage.getItem("token");
  const cookieToken = readTokenFromCookie();

  if (localToken && !cookieToken) {
    document.cookie = `token=${encodeURIComponent(localToken)}; path=/; max-age=${AUTH_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
    return localToken;
  }

  if (!localToken && cookieToken) {
    localStorage.setItem("token", cookieToken);
    return cookieToken;
  }

  return localToken || cookieToken;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const isFormData = options.body instanceof FormData;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
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
      imageUrl?: string;
      coverImageUrl?: string;
      previewImageUrls?: string[];
      locationName?: string;
      latitude?: number;
      longitude?: number;
      startDate?: string;
      endDate?: string;
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
    adminCancel: (id: string) =>
      request<{ success: boolean; booking: Booking }>(
        `/api/bookings/${id}/admin-cancel`,
        { method: "PATCH" },
      ),
  },
  uploads: {
    uploadEventImages: (files: File[]) => {
      const formData = new FormData();
      files.forEach((file) => formData.append("images", file));
      return request<{ success: boolean; urls: string[] }>(
        "/api/uploads/events",
        {
          method: "POST",
          body: formData,
        },
      );
    },
  },
  blogs: {
    list: () => request<{ success: boolean; blogs: Blog[] }>("/api/blogs"),
    listAll: () =>
      request<{ success: boolean; blogs: Blog[] }>("/api/blogs/admin/all"),
    get: (idOrSlug: string) =>
      request<{ success: boolean; blog: Blog }>(`/api/blogs/${idOrSlug}`),
    getById: (id: string) =>
      request<{ success: boolean; blog: Blog }>(`/api/blogs/admin/${id}`),
    create: (body: {
      title: string;
      excerpt?: string;
      content: string;
      coverImageUrl?: string;
      isPublished?: boolean;
    }) =>
      request<{ success: boolean; blog: Blog }>("/api/blogs", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    update: (
      id: string,
      body: {
        title?: string;
        excerpt?: string;
        content?: string;
        coverImageUrl?: string;
        isPublished?: boolean;
      },
    ) =>
      request<{ success: boolean; blog: Blog }>(`/api/blogs/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    remove: (id: string) =>
      request<{ success: boolean; message: string }>(`/api/blogs/${id}`, {
        method: "DELETE",
      }),
    duplicate: (id: string) =>
      request<{ success: boolean; blog: Blog }>(`/api/blogs/${id}/duplicate`, {
        method: "POST",
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

export interface Event {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  coverImageUrl?: string;
  previewImageUrls?: string[];
  locationName?: string;
  latitude?: number;
  longitude?: number;
  startDate?: string;
  endDate?: string;
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
  event: {
    id: string;
    title: string;
    imageUrl?: string;
    coverImageUrl?: string;
    previewImageUrls?: string[];
    locationName?: string;
    latitude?: number;
    longitude?: number;
    duration: number;
    price: number;
  };
  user?: { id: string; name: string; email: string };
}

export interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  coverImageUrl?: string;
  isPublished?: boolean;
  createdAt: string;
  updatedAt?: string;
  author: {
    id: string;
    name: string;
    email?: string;
  };
}
