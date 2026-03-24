"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, Clock, DollarSign, Loader2, Ticket } from "lucide-react";
import { api, Event } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export default function PublicEventsSection() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
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

    void fetchEvents();
  }, []);

  return (
    <section id="events" className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-12">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-500 mb-3">
              Public Events
            </p>
            <h2 className="text-4xl font-extrabold text-gray-900 mb-3">
              Explore what is available before you sign in
            </h2>
            <p className="max-w-2xl text-lg text-gray-500">
              Guests can browse active events and available slots. Booking stays
              protected, so signing in is only required when you are ready to
              reserve.
            </p>
          </div>
          <Link
            href={user ? "/dashboard/bookings" : "/auth/sign-in"}
            className="inline-flex items-center justify-center rounded-2xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            {user ? "Go to Booking Dashboard" : "Sign in to book"}
          </Link>
        </div>

        {loading && (
          <div className="flex items-center justify-center rounded-3xl border border-gray-100 bg-gray-50 py-16">
            <div className="flex items-center gap-3 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
              Loading events...
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        {!loading && !error && events.length === 0 && (
          <div className="rounded-3xl border border-gray-100 bg-gray-50 py-16 text-center text-gray-500">
            No public events are available right now.
          </div>
        )}

        {!loading && !error && events.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {events.map((event) => {
              const bookingHref = user
                ? `/dashboard/bookings?eventId=${event.id}`
                : `/auth/sign-in?redirect=${encodeURIComponent(`/dashboard/bookings?eventId=${event.id}`)}`;

              return (
                <article
                  key={event.id}
                  className="rounded-3xl border border-gray-100 bg-linear-to-br from-white to-gray-50 p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50"
                >
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {event.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-gray-500">
                        {event.description ||
                          "Join this event and reserve a slot when you are ready."}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600">
                      <Ticket className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-6 text-sm text-gray-600">
                    <div className="rounded-2xl bg-white px-4 py-3 border border-gray-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-indigo-500" />
                        <span className="font-medium">Duration</span>
                      </div>
                      <p>{event.duration} minutes</p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3 border border-gray-100">
                      <div className="flex items-center gap-2 mb-1">
                        <CalendarDays className="w-4 h-4 text-indigo-500" />
                        <span className="font-medium">Availability</span>
                      </div>
                      <p>
                        {event.maxSlots - (event._count?.bookings || 0)}/
                        {event.maxSlots} slots
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-t border-gray-100 pt-5">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Price
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-lg font-bold text-gray-900">
                        <DollarSign className="w-4 h-4 text-emerald-500" />
                        {event.price > 0 ? event.price.toFixed(2) : "Free"}
                      </p>
                    </div>
                    <Link
                      href={bookingHref}
                      className="inline-flex items-center justify-center rounded-2xl bg-linear-to-r from-indigo-500 to-violet-600 px-5 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    >
                      {user ? "Book This Event" : "Sign In to Book"}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
