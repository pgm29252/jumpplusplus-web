"use client";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Loader2,
  CheckCircle2,
  MapPin,
  ExternalLink,
  X,
} from "lucide-react";
import { api, Event } from "@/lib/api";
import Calendar from "@/components/Calendar";
import { formatDate } from "@/lib/utils";

function toStartOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toEndOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function BookingsContent() {
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState("09:00");
  const [notes, setNotes] = useState("");
  const [booking, setBooking] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [success, setSuccess] = useState("");
  const [mapLat, setMapLat] = useState<number>(-6.7924);
  const [mapLng, setMapLng] = useState<number>(39.2083);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapNote, setMapNote] = useState("");
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);
  const [modalGalleryIndex, setModalGalleryIndex] = useState(0);
  const [modalSlideDirection, setModalSlideDirection] = useState(1);
  const eventsListRef = useRef<HTMLDivElement | null>(null);
  const today = useMemo(() => toStartOfDay(new Date()), []);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    const eventId = searchParams.get("eventId");
    if (!eventId || events.length === 0) return;

    const matchedEvent = events.find((event) => event.id === eventId);
    if (matchedEvent) {
      if (!selectedDate) {
        const preferred = matchedEvent.startDate
          ? toStartOfDay(new Date(matchedEvent.startDate))
          : today;
        setSelectedDate(preferred < today ? today : preferred);
      }
      setSelectedEvent(matchedEvent);
    }
  }, [events, searchParams, selectedDate, today]);

  useEffect(() => {
    if (!selectedEvent) return;

    if (
      typeof selectedEvent.latitude === "number" &&
      typeof selectedEvent.longitude === "number"
    ) {
      setMapLat(selectedEvent.latitude);
      setMapLng(selectedEvent.longitude);
      setMapLoading(false);
      setMapNote(
        selectedEvent.locationName
          ? `Location: ${selectedEvent.locationName}`
          : "Location preview powered by OpenStreetMap",
      );
      return;
    }

    const geocodeEvent = async () => {
      setMapLoading(true);
      setMapNote("Resolving event location from OpenStreetMap...");

      const query =
        `${selectedEvent.locationName ?? ""} ${selectedEvent.title} ${selectedEvent.description ?? ""}`.trim();

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`,
        );
        const data = (await res.json()) as Array<{ lat: string; lon: string }>;

        if (Array.isArray(data) && data.length > 0) {
          setMapLat(Number(data[0].lat));
          setMapLng(Number(data[0].lon));
          setMapNote("Location preview powered by OpenStreetMap");
        } else {
          setMapLat(-6.7924);
          setMapLng(39.2083);
          setMapNote("Exact location unavailable. Showing default map area.");
        }
      } catch {
        setMapLat(-6.7924);
        setMapLng(39.2083);
        setMapNote("Could not load map location. Showing default map area.");
      } finally {
        setMapLoading(false);
      }
    };

    void geocodeEvent();
  }, [selectedEvent]);

  const bbox = `${mapLng - 0.01}%2C${mapLat - 0.01}%2C${mapLng + 0.01}%2C${mapLat + 0.01}`;
  const marker = `${mapLat}%2C${mapLng}`;
  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${marker}`;
  const osmMapUrl = `https://www.openstreetmap.org/?mlat=${mapLat}&mlon=${mapLng}#map=14/${mapLat}/${mapLng}`;

  const selectedStartTime = (() => {
    if (!selectedEvent || !selectedDate || !selectedTime) return null;
    const [hours, minutes] = selectedTime.split(":").map(Number);
    const start = new Date(selectedDate);
    start.setHours(hours, minutes, 0, 0);
    return start;
  })();

  const selectedEndTime =
    selectedStartTime && selectedEvent
      ? new Date(selectedStartTime.getTime() + selectedEvent.duration * 60000)
      : null;

  const occupiedSlotsAtSelectedTime =
    selectedEvent && selectedStartTime && selectedEndTime
      ? (selectedEvent.bookings ?? []).filter((booking) => {
          if (booking.status !== "CONFIRMED") return false;
          const bookingStart = new Date(booking.startTime);
          const bookingEnd = new Date(booking.endTime);
          return (
            bookingStart < selectedEndTime && bookingEnd > selectedStartTime
          );
        }).length
      : 0;

  const remainingSlotsAtSelectedTime =
    selectedEvent && selectedStartTime
      ? Math.max(0, selectedEvent.maxSlots - occupiedSlotsAtSelectedTime)
      : null;

  const eventsForSelectedDate = useMemo(
    () =>
      selectedDate
        ? events.filter((event) => {
            const selectedStart = toStartOfDay(selectedDate);
            const selectedEnd = toEndOfDay(selectedDate);
            const eventStart = event.startDate
              ? toStartOfDay(new Date(event.startDate))
              : null;
            const eventEnd = event.endDate
              ? toEndOfDay(new Date(event.endDate))
              : null;

            if (eventStart && selectedEnd < eventStart) return false;
            if (eventEnd && selectedStart > eventEnd) return false;
            return true;
          })
        : [],
    [events, selectedDate],
  );

  const modalGalleryImages = useMemo(() => {
    if (!selectedEvent) return [] as string[];

    const images = [
      selectedEvent.coverImageUrl,
      selectedEvent.imageUrl,
      ...(selectedEvent.previewImageUrls ?? []),
    ].filter((value): value is string => Boolean(value));

    return Array.from(new Set(images));
  }, [selectedEvent]);

  useEffect(() => {
    setModalSlideDirection(1);
    setModalGalleryIndex(0);
  }, [showConfirmModal, selectedEvent?.id]);

  const showPrevModalImage = () => {
    if (modalGalleryImages.length === 0) return;
    setModalSlideDirection(-1);
    setModalGalleryIndex(
      (prev) =>
        (prev - 1 + modalGalleryImages.length) % modalGalleryImages.length,
    );
  };

  const showNextModalImage = () => {
    if (modalGalleryImages.length === 0) return;
    setModalSlideDirection(1);
    setModalGalleryIndex((prev) => (prev + 1) % modalGalleryImages.length);
  };

  useEffect(() => {
    const updateEventListFade = () => {
      const element = eventsListRef.current;
      if (!element) {
        setShowTopFade(false);
        setShowBottomFade(false);
        return;
      }

      const hasScrollableContent =
        element.scrollHeight > element.clientHeight + 1;
      const isScrolledFromTop = element.scrollTop > 4;
      const canScrollFurtherDown =
        element.scrollTop + element.clientHeight < element.scrollHeight - 4;

      setShowTopFade(hasScrollableContent && isScrolledFromTop);
      setShowBottomFade(hasScrollableContent && canScrollFurtherDown);
    };

    updateEventListFade();
    window.addEventListener("resize", updateEventListFade);

    return () => {
      window.removeEventListener("resize", updateEventListFade);
    };
  }, [selectedDate, events.length, eventsForSelectedDate.length]);

  useEffect(() => {
    if (!selectedEvent || !selectedDate) return;
    const stillAvailable = eventsForSelectedDate.some(
      (event) => event.id === selectedEvent.id,
    );
    if (!stillAvailable) {
      setSelectedEvent(null);
    }
  }, [selectedDate, selectedEvent, eventsForSelectedDate]);

  const fetchEvents = async () => {
    try {
      const data = await api.events.list();
      setEvents(data.events);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!selectedEvent || !selectedDate || !selectedTime) return;

    setShowConfirmModal(false);
    setBooking(true);
    setError("");
    setSuccess("");
    try {
      const [hours, minutes] = selectedTime.split(":").map(Number);
      const startTime = new Date(selectedDate);
      startTime.setHours(hours, minutes, 0);

      await api.bookings.create({
        eventId: selectedEvent.id,
        startTime: startTime.toISOString(),
        notes,
      });

      setSuccess(
        `Booking confirmed for ${formatDate(startTime.toISOString())} at ${selectedTime}.`,
      );
      await fetchEvents();
      setShowConfirmModal(false);
      setSelectedTime("09:00");
      setNotes("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
            Book an Event
          </h1>
          <p className="text-gray-600">
            Choose an event and select your preferred date and time
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          <div className="lg:col-span-3 lg:sticky lg:top-6">
            {/* View My Bookings */}
            <div className="mb-2">
              <Link
                href="/dashboard/my-bookings"
                className="inline-block px-6 py-2 bg-gray-200 text-gray-900 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
              >
                View My Bookings
              </Link>
            </div>

            <Calendar
              onSelectDate={setSelectedDate}
              minDate={today}
              selectedDate={selectedDate}
            />
          </div>

          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                Available Events
              </h2>
              {selectedDate && (
                <span className="text-xs font-semibold rounded-full border border-gray-200 bg-white px-3 py-1 text-gray-600">
                  {formatDate(selectedDate.toISOString())}
                </span>
              )}
            </div>

            <div className="relative">
              {showTopFade && (
                <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-gradient-to-b from-gray-50 via-gray-50/80 to-transparent" />
              )}
              {showBottomFade && (
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-12 bg-gradient-to-t from-gray-50 via-gray-50/85 to-transparent" />
              )}

              <div
                ref={eventsListRef}
                onScroll={() => {
                  const element = eventsListRef.current;
                  if (!element) return;

                  const hasScrollableContent =
                    element.scrollHeight > element.clientHeight + 1;
                  const isScrolledFromTop = element.scrollTop > 4;
                  const canScrollFurtherDown =
                    element.scrollTop + element.clientHeight <
                    element.scrollHeight - 4;

                  setShowTopFade(hasScrollableContent && isScrolledFromTop);
                  setShowBottomFade(
                    hasScrollableContent && canScrollFurtherDown,
                  );
                }}
                className="space-y-4 max-h-[72vh] overflow-auto pr-1 pb-4 pt-3"
              >
                {!selectedDate ? (
                  <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                    <p className="text-gray-500">
                      Select a date to see available events
                    </p>
                  </div>
                ) : events.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                    <p className="text-gray-500">No events available</p>
                  </div>
                ) : eventsForSelectedDate.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                    <p className="text-gray-500">
                      No events available on this date
                    </p>
                  </div>
                ) : (
                  eventsForSelectedDate.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedEvent?.id === event.id
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      {(event.coverImageUrl || event.imageUrl) && (
                        <div className="mb-3 overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                          <img
                            src={event.coverImageUrl || event.imageUrl}
                            alt={`${event.title} preview`}
                            className="h-28 w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      )}

                      {(event.previewImageUrls?.length ?? 0) > 0 && (
                        <div className="mb-3 grid grid-cols-4 gap-1.5">
                          {event.previewImageUrls?.slice(0, 4).map((url) => (
                            <div
                              key={url}
                              className="overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
                            >
                              <img
                                src={url}
                                alt={`${event.title} preview thumbnail`}
                                className="h-12 w-full object-cover"
                                loading="lazy"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mb-2 flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-semibold text-gray-900">
                            {event.title}
                          </h3>
                          {event.description && (
                            <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                              {event.description}
                            </p>
                          )}
                        </div>
                        {event.price > 0 && (
                          <div className="flex items-center gap-1 rounded-lg bg-green-50 px-2.5 py-1 text-green-700">
                            <DollarSign className="w-4 h-4" />
                            <span className="font-semibold">{event.price}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {event.duration} minutes
                        </div>
                        <div className="flex items-center gap-2">
                          <CalendarDays className="w-4 h-4" />
                          {event.maxSlots} max slots
                        </div>
                      </div>

                      {(event.startDate || event.endDate) && (
                        <p className="mt-2 text-xs text-gray-500">
                          Booking window:{" "}
                          {event.startDate
                            ? new Date(event.startDate).toLocaleDateString()
                            : "-"}{" "}
                          to{" "}
                          {event.endDate
                            ? new Date(event.endDate).toLocaleDateString()
                            : "-"}
                        </p>
                      )}

                      <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-3">
                        <p className="text-xs text-gray-500">
                          {selectedEvent?.id === event.id
                            ? "Selected"
                            : "Select this event to continue"}
                        </p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(event);
                            setError("");
                            setSuccess("");
                            setShowConfirmModal(true);
                          }}
                          disabled={!selectedDate || booking}
                          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Book Event
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {success && (
          <div className="mt-4 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 mt-0.5" />
            <p className="text-sm font-medium">{success}</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showConfirmModal && selectedEvent && selectedDate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Confirm Booking
                  </h3>
                  <p className="text-sm text-gray-500">{selectedEvent.title}</p>
                </div>
                <button
                  type="button"
                  onClick={() => !booking && setShowConfirmModal(false)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  disabled={booking}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="max-h-[75vh] overflow-auto px-6 py-5">
                {modalGalleryImages.length > 0 && (
                  <div className="mb-5">
                    <div className="relative h-52 overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                      <AnimatePresence
                        custom={modalSlideDirection}
                        initial={false}
                        mode="wait"
                      >
                        <motion.img
                          key={`${modalGalleryImages[modalGalleryIndex]}-${modalGalleryIndex}`}
                          src={modalGalleryImages[modalGalleryIndex]}
                          alt={`${selectedEvent.title} gallery image ${modalGalleryIndex + 1}`}
                          className="absolute inset-0 h-full w-full object-cover"
                          loading="lazy"
                          custom={modalSlideDirection}
                          initial={{
                            x: modalSlideDirection > 0 ? 48 : -48,
                            opacity: 0,
                            scale: 1.02,
                          }}
                          animate={{ x: 0, opacity: 1, scale: 1 }}
                          exit={{
                            x: modalSlideDirection > 0 ? -48 : 48,
                            opacity: 0,
                            scale: 0.98,
                          }}
                          transition={{
                            duration: 0.28,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                        />
                      </AnimatePresence>

                      {modalGalleryImages.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={showPrevModalImage}
                            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-gray-700 shadow transition hover:bg-white"
                            aria-label="Previous image"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={showNextModalImage}
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-gray-700 shadow transition hover:bg-white"
                            aria-label="Next image"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white">
                            {modalGalleryIndex + 1}/{modalGalleryImages.length}
                          </div>
                        </>
                      )}
                    </div>

                    {modalGalleryImages.length > 1 && (
                      <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                        {modalGalleryImages.map((imgUrl, index) => (
                          <button
                            key={`${imgUrl}-${index}`}
                            type="button"
                            onClick={() => {
                              if (index === modalGalleryIndex) return;
                              setModalSlideDirection(
                                index > modalGalleryIndex ? 1 : -1,
                              );
                              setModalGalleryIndex(index);
                            }}
                            className={`overflow-hidden rounded-lg border-2 transition ${
                              modalGalleryIndex === index
                                ? "border-indigo-500"
                                : "border-transparent hover:border-gray-300"
                            }`}
                            aria-label={`View image ${index + 1}`}
                          >
                            <img
                              src={imgUrl}
                              alt={`${selectedEvent.title} thumbnail ${index + 1}`}
                              className="h-14 w-20 object-cover"
                              loading="lazy"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
                  2. Complete your booking details for{" "}
                  {formatDate(selectedDate.toISOString())}
                </div>

                <div className="mb-5">
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Select Time
                  </label>
                  <input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500"
                  />
                  {remainingSlotsAtSelectedTime !== null && (
                    <p className="mt-2 text-xs text-gray-500">
                      Slots remaining at selected time:{" "}
                      {remainingSlotsAtSelectedTime}/{selectedEvent.maxSlots}
                    </p>
                  )}
                </div>

                <div className="mb-5">
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Notes (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes or special requests..."
                    className="w-full resize-none rounded-lg border border-gray-200 px-4 py-2 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500"
                    rows={3}
                  />
                </div>

                <div className="mb-5">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <MapPin className="w-4 h-4 text-indigo-500" />
                      Event Location
                    </div>
                    <a
                      href={osmMapUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      Open in OSM <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                    <iframe
                      title="Event location map"
                      src={osmEmbedUrl}
                      className="h-52 w-full"
                      loading="lazy"
                    />
                  </div>

                  <p className="mt-2 text-xs text-gray-500">
                    {mapLoading ? "Loading map..." : mapNote}
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium text-gray-900">
                        {formatDate(selectedDate.toISOString())}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time:</span>
                      <span className="font-medium text-gray-900">
                        {selectedTime}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium text-gray-900">
                        {selectedEvent.duration} min
                      </span>
                    </div>
                    {selectedEvent.price > 0 && (
                      <div className="flex justify-between border-t border-gray-200 pt-2">
                        <span className="text-gray-600">Price:</span>
                        <span className="font-semibold text-gray-900">
                          ${selectedEvent.price}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={booking}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBooking}
                  disabled={booking}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {booking ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    "Confirm Booking"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function BookingsPage() {
  return (
    <Suspense fallback={null}>
      <BookingsContent />
    </Suspense>
  );
}
