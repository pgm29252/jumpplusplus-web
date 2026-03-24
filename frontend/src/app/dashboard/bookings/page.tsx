"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Clock,
  DollarSign,
  Loader2,
  CheckCircle2,
  X,
} from "lucide-react";
import { api, Event } from "@/lib/api";
import Calendar from "@/components/Calendar";
import ActionConfirmModal from "../../../components/ui/ActionConfirmModal";
import { formatDate } from "@/lib/utils";

export default function BookingsPage() {
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

  useEffect(() => {
    fetchEvents();
  }, []);

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
      setSelectedEvent(null);
      setSelectedDate(null);
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Events List */}
          <div className="lg:col-span-2">
            {error && (
              <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {events.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                  <p className="text-gray-500">No events available</p>
                </div>
              ) : (
                events.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedEvent?.id === event.id
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {event.title}
                        </h3>
                        {event.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {event.description}
                          </p>
                        )}
                      </div>
                      {event.price > 0 && (
                        <div className="flex items-center gap-1 bg-green-50 text-green-700 px-3 py-1 rounded-lg">
                          <DollarSign className="w-4 h-4" />
                          <span className="font-semibold">{event.price}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {event.duration} minutes
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4" />
                        {event.maxSlots - (event._count?.bookings || 0)}/
                        {event.maxSlots} slots available
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Booking Form */}
          {selectedEvent && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Book {selectedEvent.title}
                  </h3>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Calendar */}
                <div className="mb-6">
                  <Calendar
                    onSelectDate={setSelectedDate}
                    minDate={new Date()}
                  />
                </div>

                {/* Time Selection */}
                {selectedDate && (
                  <>
                    <div className="mb-6">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Select Time
                      </label>
                      <input
                        type="time"
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 text-gray-900 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Notes */}
                    <div className="mb-6">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Notes (optional)
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add any notes or special requests..."
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 resize-none"
                        rows={3}
                      />
                    </div>

                    {/* Booking Summary */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <div className="text-sm space-y-2">
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
                          <div className="flex justify-between pt-2 border-t border-gray-200">
                            <span className="text-gray-600">Price:</span>
                            <span className="font-semibold text-gray-900">
                              ${selectedEvent.price}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Book Button */}
                    <button
                      onClick={() => {
                        setError("");
                        setSuccess("");
                        setShowConfirmModal(true);
                      }}
                      disabled={booking}
                      className="w-full bg-indigo-600 text-white font-semibold py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {booking ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Booking...
                        </>
                      ) : (
                        "Confirm Booking"
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {success && (
          <div className="mt-4 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 mt-0.5" />
            <p className="text-sm font-medium">{success}</p>
          </div>
        )}

        {/* View My Bookings */}
        <div className="mt-12 text-center">
          <Link
            href="/dashboard/my-bookings"
            className="inline-block px-6 py-2 bg-gray-200 text-gray-900 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
          >
            View My Bookings
          </Link>
        </div>
      </div>

      <ActionConfirmModal
        open={showConfirmModal}
        title="Confirm this booking?"
        description={
          selectedEvent && selectedDate
            ? `${selectedEvent.title} on ${formatDate(selectedDate.toISOString())} at ${selectedTime}`
            : "Please confirm this booking action."
        }
        confirmLabel="Confirm Booking"
        loading={booking}
        onConfirm={handleBooking}
        onClose={() => setShowConfirmModal(false)}
      />
    </div>
  );
}
