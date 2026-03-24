"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  DollarSign,
  Trash2,
  Loader2,
  CheckCircle,
  CheckCircle2,
  Clock3,
  XCircle,
} from "lucide-react";
import { api, Booking } from "@/lib/api";
import ActionConfirmModal from "../../../components/ui/ActionConfirmModal";
import { formatDate } from "@/lib/utils";

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [success, setSuccess] = useState("");
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const data = await api.bookings.list();
      setBookings(data.bookings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId: string) => {
    setError("");
    setSuccess("");
    setBookingToCancel(null);
    setCancelling(bookingId);
    try {
      await api.bookings.cancel(bookingId);
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: "CANCELLED" } : b,
        ),
      );
      setSuccess("Booking cancelled successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel booking");
    } finally {
      setCancelling(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "PENDING":
        return <Clock3 className="w-5 h-5 text-yellow-600" />;
      case "CANCELLED":
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-green-50 text-green-700";
      case "PENDING":
        return "bg-yellow-50 text-yellow-700";
      case "CANCELLED":
        return "bg-red-50 text-red-700";
      default:
        return "bg-gray-50 text-gray-700";
    }
  };

  const upcomingBookings = bookings.filter(
    (b) => b.status !== "CANCELLED" && new Date(b.startTime) > new Date(),
  );

  const pastBookings = bookings.filter(
    (b) => b.status !== "CANCELLED" && new Date(b.startTime) <= new Date(),
  );

  const cancelledBookings = bookings.filter((b) => b.status === "CANCELLED");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
                My Bookings
              </h1>
              <p className="text-gray-600">Manage your event bookings</p>
            </div>
            <Link
              href="/dashboard/bookings"
              className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Book New Event
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 mt-0.5" />
            <p className="text-sm font-medium">{success}</p>
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600 mb-4">No bookings yet</p>
            <Link
              href="/dashboard/bookings"
              className="inline-block px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Book Your First Event
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Upcoming */}
            {upcomingBookings.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Upcoming Bookings
                </h2>
                <div className="space-y-3">
                  {upcomingBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {booking.event.title}
                          </h3>
                          {booking.notes && (
                            <p className="text-sm text-gray-600 mt-1">
                              {booking.notes}
                            </p>
                          )}
                        </div>
                        <div
                          className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium ${getStatusColor(booking.status)}`}
                        >
                          {getStatusIcon(booking.status)}
                          {booking.status}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          {formatDate(booking.startTime)}
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-4 h-4" />
                          {new Date(booking.startTime).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-4 h-4" />
                          {booking.event.duration} min
                        </div>
                        {booking.event.price > 0 && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <DollarSign className="w-4 h-4" />$
                            {booking.event.price}
                          </div>
                        )}
                      </div>

                      {booking.status === "CONFIRMED" &&
                        new Date(booking.startTime) > new Date() && (
                          <button
                            onClick={() => setBookingToCancel(booking)}
                            disabled={cancelling === booking.id}
                            className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium text-sm disabled:opacity-60"
                          >
                            {cancelling === booking.id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Cancelling...
                              </>
                            ) : (
                              <>
                                <Trash2 className="w-4 h-4" />
                                Cancel Booking
                              </>
                            )}
                          </button>
                        )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Past */}
            {pastBookings.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Past Bookings
                </h2>
                <div className="space-y-3">
                  {pastBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="bg-gray-50 rounded-xl border border-gray-200 p-6 opacity-75"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {booking.event.title}
                          </h3>
                        </div>
                        <div
                          className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium ${getStatusColor(booking.status)}`}
                        >
                          {getStatusIcon(booking.status)}
                          {booking.status}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {formatDate(booking.startTime)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {new Date(booking.startTime).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Cancelled */}
            {cancelledBookings.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Cancelled Bookings
                </h2>
                <div className="space-y-3">
                  {cancelledBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="bg-red-50 rounded-xl border border-red-200 p-6 opacity-60"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {booking.event.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Cancelled on {formatDate(booking.createdAt)}
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-lg text-sm font-medium bg-red-100 text-red-700">
                          CANCELLED
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      <ActionConfirmModal
        open={Boolean(bookingToCancel)}
        title="Cancel this booking?"
        description={
          bookingToCancel
            ? `${bookingToCancel.event.title} on ${formatDate(bookingToCancel.startTime)}. This action cannot be undone.`
            : "Please confirm booking cancellation."
        }
        confirmLabel="Cancel Booking"
        danger
        loading={Boolean(cancelling)}
        onConfirm={() => {
          if (!bookingToCancel) return;
          const id = bookingToCancel.id;
          handleCancel(id);
        }}
        onClose={() => {
          if (!cancelling) setBookingToCancel(null);
        }}
      />
    </div>
  );
}
