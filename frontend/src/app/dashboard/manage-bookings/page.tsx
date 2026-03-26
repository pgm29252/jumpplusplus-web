"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Loader2, Trash2, User, MapPin } from "lucide-react";
import { api, Booking } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import ActionConfirmModal from "@/components/ui/ActionConfirmModal";
import ToastNotice from "@/components/ui/ToastNotice";
import { formatDate } from "@/lib/utils";

export default function ManageBookingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelToast, setCancelToast] = useState<"idle" | "done" | "error">(
    "idle",
  );

  useEffect(() => {
    if (
      !loading &&
      (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR"))
    ) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  const fetchBookings = useCallback(async () => {
    setFetching(true);
    setError("");
    try {
      const res = await api.bookings.listAll();
      setBookings(res.bookings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bookings");
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (user && (user.role === "ADMIN" || user.role === "MODERATOR")) {
      void fetchBookings();
    }
  }, [user, fetchBookings]);

  const activeBookings = useMemo(
    () => bookings.filter((b) => b.status !== "CANCELLED"),
    [bookings],
  );

  const cancelledBookings = useMemo(
    () => bookings.filter((b) => b.status === "CANCELLED"),
    [bookings],
  );

  const handleAdminCancel = async () => {
    if (!bookingToCancel) return;
    setCancelLoading(true);
    try {
      await api.bookings.adminCancel(bookingToCancel.id);
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingToCancel.id ? { ...b, status: "CANCELLED" } : b,
        ),
      );
      setCancelToast("done");
    } catch {
      setCancelToast("error");
    } finally {
      setBookingToCancel(null);
      setCancelLoading(false);
      window.setTimeout(() => setCancelToast("idle"), 1800);
    }
  };

  if (
    loading ||
    !user ||
    (user.role !== "ADMIN" && user.role !== "MODERATOR")
  ) {
    return null;
  }

  return (
    <div className="brand-surface mx-auto max-w-6xl p-6">
      <div className="brand-glass mb-6 rounded-3xl px-6 py-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700/80">
          Booking Admin
        </p>
        <h1 className="text-2xl font-bold text-gray-900">Manage Bookings</h1>
        <p className="mt-1 text-sm text-gray-500">
          View who booked each event and cancel bookings when needed.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {fetching ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl bg-gray-100"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-gray-900">
              Active bookings ({activeBookings.length})
            </h2>
            <div className="brand-glass overflow-hidden rounded-2xl shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-emerald-100 bg-white/70">
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      User
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      Event
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden md:table-cell">
                      When
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden lg:table-cell">
                      Location
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activeBookings.map((booking) => (
                    <tr
                      key={booking.id}
                      className="transition-colors hover:bg-white/70"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {booking.user?.name ?? "Unknown"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {booking.user?.email ?? "-"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-gray-900">
                          {booking.event.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {booking.status}
                        </p>
                      </td>
                      <td className="hidden px-4 py-4 text-gray-600 md:table-cell">
                        <div className="inline-flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-gray-400" />
                          <span>
                            {formatDate(booking.startTime)}{" "}
                            {new Date(booking.startTime).toLocaleTimeString(
                              [],
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="hidden px-4 py-4 text-gray-600 lg:table-cell">
                        <div className="inline-flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span>{booking.event.locationName ?? "-"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end">
                          <button
                            onClick={() => setBookingToCancel(booking)}
                            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {activeBookings.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-10 text-center text-sm text-gray-500"
                      >
                        No active bookings.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-gray-900">
              Cancelled bookings ({cancelledBookings.length})
            </h2>
            <div className="brand-glass overflow-hidden rounded-2xl shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-emerald-100 bg-white/70">
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      User
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      Event
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">
                      When
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cancelledBookings.map((booking) => (
                    <tr key={booking.id} className="text-gray-500">
                      <td className="px-4 py-4">
                        {booking.user?.name ?? "Unknown"}
                      </td>
                      <td className="px-4 py-4">{booking.event.title}</td>
                      <td className="px-4 py-4">
                        {formatDate(booking.startTime)}
                      </td>
                    </tr>
                  ))}
                  {cancelledBookings.length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-10 text-center text-sm text-gray-500"
                      >
                        No cancelled bookings.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      <ActionConfirmModal
        open={bookingToCancel !== null}
        title="Cancel booking"
        description={`Cancel booking for \"${bookingToCancel?.user?.name ?? "this user"}\" on \"${bookingToCancel?.event.title ?? "this event"}\"?`}
        confirmLabel="Cancel booking"
        danger
        loading={cancelLoading}
        onConfirm={handleAdminCancel}
        onClose={() => setBookingToCancel(null)}
      />

      <ToastNotice
        open={cancelToast !== "idle"}
        tone={cancelToast === "done" ? "success" : "error"}
        message={
          cancelToast === "done"
            ? "Booking cancelled"
            : "Failed to cancel booking"
        }
      />

      {cancelLoading && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-3 py-1.5 text-xs text-white shadow-lg">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Updating booking
          </div>
        </div>
      )}
    </div>
  );
}
