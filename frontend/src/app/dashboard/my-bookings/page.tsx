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
  Clock3,
  XCircle,
  MapPinned,
  X,
  ExternalLink,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { api, Booking } from "@/lib/api";
import ActionConfirmModal from "../../../components/ui/ActionConfirmModal";
import ToastNotice from "@/components/ui/ToastNotice";
import { formatDate } from "@/lib/utils";
import DashboardPageLayout from "@/components/dashboard/DashboardPageLayout";

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [cancelToast, setCancelToast] = useState<"idle" | "done" | "error">(
    "idle",
  );
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [mapBooking, setMapBooking] = useState<Booking | null>(null);
  const [copiedCoords, setCopiedCoords] = useState<"idle" | "done" | "error">(
    "idle",
  );

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
    setBookingToCancel(null);
    setCancelling(bookingId);
    try {
      await api.bookings.cancel(bookingId);
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: "CANCELLED" } : b,
        ),
      );
      setCancelToast("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel booking");
      setCancelToast("error");
    } finally {
      setCancelling(null);
      window.setTimeout(() => setCancelToast("idle"), 1800);
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

  const getMapUrl = (booking: Booking) => {
    if (
      typeof booking.event.latitude === "number" &&
      typeof booking.event.longitude === "number"
    ) {
      const lat = booking.event.latitude.toFixed(6);
      const lng = booking.event.longitude.toFixed(6);
      return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
    }

    if (booking.event.locationName?.trim()) {
      return `https://www.openstreetmap.org/search?query=${encodeURIComponent(booking.event.locationName)}`;
    }

    return `https://www.openstreetmap.org/search?query=${encodeURIComponent(booking.event.title)}`;
  };

  const getMapEmbedUrl = (booking: Booking) => {
    if (
      typeof booking.event.latitude === "number" &&
      typeof booking.event.longitude === "number"
    ) {
      const lat = booking.event.latitude;
      const lng = booking.event.longitude;
      const delta = 0.008;
      const left = (lng - delta).toFixed(6);
      const right = (lng + delta).toFixed(6);
      const top = (lat + delta).toFixed(6);
      const bottom = (lat - delta).toFixed(6);
      return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${lat.toFixed(6)}%2C${lng.toFixed(6)}`;
    }

    return null;
  };

  const getCoordinatesText = (booking: Booking) => {
    if (
      typeof booking.event.latitude === "number" &&
      typeof booking.event.longitude === "number"
    ) {
      return `${booking.event.latitude.toFixed(6)}, ${booking.event.longitude.toFixed(6)}`;
    }

    return null;
  };

  const handleCopyCoordinates = async (booking: Booking) => {
    const coords = getCoordinatesText(booking);
    if (!coords || !navigator?.clipboard) {
      setCopiedCoords("error");
      return;
    }

    try {
      await navigator.clipboard.writeText(coords);
      setCopiedCoords("done");
      window.setTimeout(() => setCopiedCoords("idle"), 1600);
    } catch {
      setCopiedCoords("error");
      window.setTimeout(() => setCopiedCoords("idle"), 1600);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardPageLayout
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "My Bookings" },
      ]}
    >
      {/* Header */}
      <div className="brand-glass mb-8 rounded-3xl px-6 py-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700/80">
              Booking Overview
            </p>
            <h1 className="mb-2 text-3xl font-extrabold text-gray-900">
              My Bookings
            </h1>
            <p className="text-gray-600">Manage your event bookings</p>
          </div>
          <Link
            href="/dashboard/bookings"
            className="rounded-lg bg-linear-to-r from-emerald-700 to-teal-600 px-4 py-2 font-semibold text-white transition-opacity hover:opacity-90"
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

      {bookings.length === 0 ? (
        <div className="brand-glass text-center py-12 rounded-xl">
          <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 mb-4">No bookings yet</p>
          <Link
            href="/dashboard/bookings"
            className="inline-block px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors"
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
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="brand-glass rounded-2xl p-6 transition-all hover:-translate-y-0.5 hover:shadow-md"
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

                    <div className="flex flex-wrap items-center gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setCopiedCoords("idle");
                          setMapBooking(booking);
                        }}
                        className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium text-sm"
                      >
                        <MapPinned className="w-4 h-4" />
                        View Map
                      </button>

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
              <div className="space-y-4">
                {pastBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="rounded-2xl border border-emerald-100/70 bg-white/60 p-6 backdrop-blur-sm"
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
                      <button
                        type="button"
                        onClick={() => {
                          setCopiedCoords("idle");
                          setMapBooking(booking);
                        }}
                        className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        <MapPinned className="w-4 h-4" />
                        View Map
                      </button>
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
              <div className="space-y-4">
                {cancelledBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="rounded-2xl border border-rose-200 bg-rose-50/75 p-6 backdrop-blur-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {booking.event.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Cancelled on {formatDate(booking.createdAt)}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setCopiedCoords("idle");
                            setMapBooking(booking);
                          }}
                          className="mt-2 inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium text-sm"
                        >
                          <MapPinned className="w-4 h-4" />
                          View Map
                        </button>
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

      <AnimatePresence>
        {mapBooking && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/45"
              onClick={() => setMapBooking(null)}
            />

            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="brand-glass-strong relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-emerald-100 shadow-2xl"
            >
              <div className="flex items-start justify-between border-b border-emerald-100 bg-white/80 px-4 py-3 backdrop-blur-sm">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    {mapBooking.event.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {mapBooking.event.locationName?.trim() ||
                      "Selected event location"}
                  </p>
                  {getCoordinatesText(mapBooking) && (
                    <p className="text-xs text-gray-500 mt-1">
                      Coordinates: {getCoordinatesText(mapBooking)}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setMapBooking(null)}
                  className="rounded-lg p-1.5 text-gray-500 hover:bg-emerald-50 hover:text-gray-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {getMapEmbedUrl(mapBooking) ? (
                <iframe
                  title={`Map for ${mapBooking.event.title}`}
                  src={getMapEmbedUrl(mapBooking) ?? undefined}
                  className="h-80 w-full"
                />
              ) : (
                <div className="flex h-80 items-center justify-center bg-white/70 px-6 text-center text-sm text-gray-600">
                  Exact coordinates are not available for this event yet. You
                  can still open a search map view.
                </div>
              )}

              <div className="flex flex-wrap items-center justify-end gap-2 border-t border-emerald-100 bg-white/70 px-4 py-3">
                {getCoordinatesText(mapBooking) && (
                  <button
                    type="button"
                    onClick={() => handleCopyCoordinates(mapBooking)}
                    disabled={copiedCoords !== "idle"}
                    className="rounded-lg border border-emerald-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {copiedCoords === "done"
                      ? "Copied"
                      : copiedCoords === "error"
                        ? "Copy failed"
                        : "Copy Coordinates"}
                  </button>
                )}
                <button
                  onClick={() => setMapBooking(null)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-emerald-50"
                >
                  Close
                </button>
                <a
                  href={getMapUrl(mapBooking)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open in OSM
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ToastNotice
        open={copiedCoords !== "idle"}
        tone={copiedCoords === "done" ? "success" : "error"}
        message={
          copiedCoords === "done"
            ? "Coordinates copied"
            : "Unable to copy coordinates"
        }
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
    </DashboardPageLayout>
  );
}
