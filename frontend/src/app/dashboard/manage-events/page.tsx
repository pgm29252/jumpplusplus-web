"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { api, Event } from "@/lib/api";
import ActionConfirmModal from "../../../components/ui/ActionConfirmModal";
import {
  modalBackdropVariants,
  modalContainerVariants,
  modalItemVariants,
} from "@/components/ui/modalMotion";
import {
  Plus,
  Pencil,
  ToggleLeft,
  ToggleRight,
  X,
  Loader2,
  CalendarDays,
  Clock,
  Users,
  DollarSign,
} from "lucide-react";

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────
interface EventForm {
  title: string;
  description: string;
  duration: number;
  price: number;
  maxSlots: number;
}

const emptyForm: EventForm = {
  title: "",
  description: "",
  duration: 60,
  price: 0,
  maxSlots: 1,
};

type ModalAction =
  | { type: "deactivate"; event: Event }
  | { type: "restore"; event: Event }
  | null;

// ──────────────────────────────────────────────
// Field helper
// ──────────────────────────────────────────────
function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 mb-1.5">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </label>
      {children}
    </div>
  );
}

// ──────────────────────────────────────────────
// Main page
// ──────────────────────────────────────────────
export default function ManageEventsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [events, setEvents] = useState<Event[]>([]);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState("");

  // Form modal
  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [form, setForm] = useState<EventForm>(emptyForm);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Confirm modal
  const [modalAction, setModalAction] = useState<ModalAction>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // ── Escape key closes form modal ────────────
  useEffect(() => {
    if (!formOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !formLoading) setFormOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [formOpen, formLoading]);

  // ── Role guard ──────────────────────────────
  useEffect(() => {
    if (!loading && (!user || user.role === "USER")) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  // ── Fetch events ────────────────────────────
  const fetchEvents = useCallback(async () => {
    setFetching(true);
    setFetchError("");
    try {
      const res = await api.events.listAll();
      setEvents(res.events);
    } catch (err) {
      setFetchError(
        err instanceof Error ? err.message : "Failed to load events",
      );
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.role !== "USER") {
      fetchEvents();
    }
  }, [user, fetchEvents]);

  // ── Open create form ────────────────────────
  const openCreate = () => {
    setEditingEvent(null);
    setForm(emptyForm);
    setFormError("");
    setFormOpen(true);
  };

  // ── Open edit form ──────────────────────────
  const openEdit = (event: Event) => {
    setEditingEvent(event);
    setForm({
      title: event.title,
      description: event.description ?? "",
      duration: event.duration,
      price: event.price,
      maxSlots: event.maxSlots,
    });
    setFormError("");
    setFormOpen(true);
  };

  // ── Submit form ─────────────────────────────
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!form.title.trim()) {
      setFormError("Title is required.");
      return;
    }

    setFormLoading(true);
    try {
      if (editingEvent) {
        await api.events.update(editingEvent.id, {
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          duration: form.duration,
          price: form.price,
          maxSlots: form.maxSlots,
        });
      } else {
        await api.events.create({
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          duration: form.duration,
          price: form.price,
          maxSlots: form.maxSlots,
        });
      }
      setFormOpen(false);
      await fetchEvents();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setFormLoading(false);
    }
  };

  // ── Confirm action (deactivate / restore) ───
  const handleConfirmAction = async () => {
    if (!modalAction) return;
    setActionLoading(true);
    setModalAction(null);
    try {
      if (modalAction.type === "deactivate") {
        await api.events.delete(modalAction.event.id);
      } else {
        await api.events.restore(modalAction.event.id);
      }
      await fetchEvents();
    } catch {
      // errors surfaced via refetch
    } finally {
      setActionLoading(false);
    }
  };

  // ── Permissions ─────────────────────────────
  const canEditEvent = (event: Event) =>
    user?.role === "ADMIN" || event.createdBy?.id === user?.id;

  // ── Loading / guard ─────────────────────────
  if (loading || !user || user.role === "USER") return null;

  // ──────────────────────────────────────────────
  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Events</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Create, edit, and manage bookable events.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Event
        </button>
      </div>

      {/* Error */}
      {fetchError && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
          {fetchError}
        </div>
      )}

      {/* Loading skeleton */}
      {fetching && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 rounded-xl bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!fetching && events.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CalendarDays className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No events yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Create your first event to get started.
          </p>
        </div>
      )}

      {/* Events table */}
      {!fetching && events.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Event
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden md:table-cell">
                  Duration
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden md:table-cell">
                  Price
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden lg:table-cell">
                  Slots
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 hidden lg:table-cell">
                  Created by
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Status
                </th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {events.map((event) => (
                <tr
                  key={event.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {/* Title + description */}
                  <td className="px-4 py-4">
                    <p className="font-medium text-gray-900">{event.title}</p>
                    {event.description && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1 max-w-xs">
                        {event.description}
                      </p>
                    )}
                  </td>

                  {/* Duration */}
                  <td className="px-4 py-4 text-gray-600 hidden md:table-cell">
                    {event.duration} min
                  </td>

                  {/* Price */}
                  <td className="px-4 py-4 text-gray-600 hidden md:table-cell">
                    {event.price === 0 ? "Free" : `$${event.price.toFixed(2)}`}
                  </td>

                  {/* Slots */}
                  <td className="px-4 py-4 text-gray-600 hidden lg:table-cell">
                    {event._count?.bookings ?? 0} / {event.maxSlots}
                  </td>

                  {/* Creator */}
                  <td className="px-4 py-4 text-gray-500 hidden lg:table-cell">
                    {event.createdBy?.name ?? "—"}
                  </td>

                  {/* Status badge */}
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                        event.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          event.isActive ? "bg-emerald-500" : "bg-gray-400"
                        }`}
                      />
                      {event.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      {canEditEvent(event) && (
                        <button
                          onClick={() => openEdit(event)}
                          title="Edit event"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}

                      {canEditEvent(event) && event.isActive && (
                        <button
                          onClick={() =>
                            setModalAction({ type: "deactivate", event })
                          }
                          title="Deactivate event"
                          disabled={actionLoading}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-40"
                        >
                          <ToggleRight className="w-4 h-4" />
                        </button>
                      )}

                      {canEditEvent(event) && !event.isActive && (
                        <button
                          onClick={() =>
                            setModalAction({ type: "restore", event })
                          }
                          title="Restore event"
                          disabled={actionLoading}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-40"
                        >
                          <ToggleLeft className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Create / Edit form modal ── */}
      <AnimatePresence>
        {formOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            variants={modalBackdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-gray-900/45 backdrop-blur-sm"
              variants={modalBackdropVariants}
              onClick={() => {
                if (!formLoading) setFormOpen(false);
              }}
            />

            <motion.div
              className="relative w-full max-w-lg rounded-2xl bg-white border border-gray-200 shadow-xl p-6"
              variants={modalContainerVariants}
            >
              {/* Header */}
              <motion.div
                className="flex items-center justify-between mb-5"
                variants={modalItemVariants}
              >
                <h2 className="text-lg font-bold text-gray-900">
                  {editingEvent ? "Edit Event" : "New Event"}
                </h2>
                <button
                  onClick={() => {
                    if (!formLoading) setFormOpen(false);
                  }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>

              {formError && (
                <motion.div
                  variants={modalItemVariants}
                  className="mb-4 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700"
                >
                  {formError}
                </motion.div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-4">
                {/* Title */}
                <motion.div variants={modalItemVariants}>
                  <Field label="Title" icon={CalendarDays}>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, title: e.target.value }))
                      }
                      placeholder="e.g. Open Jump Session"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                      required
                    />
                  </Field>
                </motion.div>

                {/* Description */}
                <motion.div variants={modalItemVariants}>
                  <Field label="Description (optional)" icon={CalendarDays}>
                    <textarea
                      rows={3}
                      value={form.description}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, description: e.target.value }))
                      }
                      placeholder="Brief description of the event…"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition resize-none"
                    />
                  </Field>
                </motion.div>

                {/* Duration / Price / Slots */}
                <motion.div
                  variants={modalItemVariants}
                  className="grid grid-cols-3 gap-3"
                >
                  <Field label="Duration (min)" icon={Clock}>
                    <input
                      type="number"
                      min={1}
                      value={form.duration}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          duration: Math.max(1, parseInt(e.target.value) || 1),
                        }))
                      }
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                    />
                  </Field>

                  <Field label="Price ($)" icon={DollarSign}>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={form.price}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          price: Math.max(0, parseFloat(e.target.value) || 0),
                        }))
                      }
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                    />
                  </Field>

                  <Field label="Max Slots" icon={Users}>
                    <input
                      type="number"
                      min={1}
                      value={form.maxSlots}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          maxSlots: Math.max(1, parseInt(e.target.value) || 1),
                        }))
                      }
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                    />
                  </Field>
                </motion.div>

                {/* Submit */}
                <motion.div
                  variants={modalItemVariants}
                  className="flex justify-end gap-2 pt-2"
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (!formLoading) setFormOpen(false);
                    }}
                    disabled={formLoading}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60"
                  >
                    {formLoading && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    {editingEvent ? "Save Changes" : "Create Event"}
                  </button>
                </motion.div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Deactivate / Restore confirm ── */}
      <ActionConfirmModal
        open={modalAction !== null}
        title={
          modalAction?.type === "deactivate"
            ? "Deactivate Event"
            : "Restore Event"
        }
        description={
          modalAction?.type === "deactivate"
            ? `"${modalAction?.event.title}" will be hidden from users and cannot be booked until restored.`
            : `"${modalAction?.event.title}" will become visible and bookable again.`
        }
        confirmLabel={
          modalAction?.type === "deactivate" ? "Deactivate" : "Restore"
        }
        danger={modalAction?.type === "deactivate"}
        loading={actionLoading}
        onConfirm={handleConfirmAction}
        onClose={() => setModalAction(null)}
      />
    </div>
  );
}
