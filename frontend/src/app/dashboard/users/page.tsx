"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  Trash2,
  Edit2,
  X,
  Loader2,
  UserPlus,
  Shield,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { api, User } from "@/lib/api";
import ActionConfirmModal from "@/components/ui/ActionConfirmModal";
import {
  modalBackdropVariants,
  modalContainerVariants,
  modalItemVariants,
} from "@/components/ui/modalMotion";
import { useAuth } from "@/hooks/useAuth";
import { cn, formatDate, getRoleColor } from "@/lib/utils";
import { useRouter } from "next/navigation";

type EditData = {
  name: string;
  role: "USER" | "MODERATOR" | "ADMIN";
  isActive: boolean;
};

function EditModal({
  user,
  onClose,
  onSave,
}: {
  user: User;
  onClose: () => void;
  onSave: (data: EditData) => Promise<void>;
}) {
  const [form, setForm] = useState<EditData>({
    name: user.name,
    role: user.role,
    isActive: user.isActive,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, saving]);

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      await onSave(form);
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <motion.div
          className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          variants={modalBackdropVariants}
          onClick={() => {
            if (!saving) onClose();
          }}
        />
        <motion.div
          className="brand-glass-strong relative z-10 w-full max-w-md rounded-2xl border border-emerald-100 p-6 shadow-2xl"
          variants={modalContainerVariants}
        >
          <motion.div
            className="mb-5 flex items-center justify-between"
            variants={modalItemVariants}
          >
            <h2 className="text-lg font-bold text-gray-900">Edit User</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-emerald-50"
            >
              <X className="h-5 w-5" />
            </button>
          </motion.div>
          {error && (
            <motion.p
              className="mb-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-500"
              variants={modalItemVariants}
            >
              {error}
            </motion.p>
          )}
          <div className="space-y-4">
            <motion.div variants={modalItemVariants}>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                Name
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </motion.div>
            <motion.div variants={modalItemVariants}>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                Role
              </label>
              <select
                value={form.role}
                onChange={(e) =>
                  setForm({ ...form, role: e.target.value as EditData["role"] })
                }
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="USER">User</option>
                <option value="MODERATOR">Moderator</option>
                <option value="ADMIN">Admin</option>
              </select>
            </motion.div>
            <motion.div variants={modalItemVariants}>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                Status
              </label>
              <select
                value={form.isActive ? "active" : "inactive"}
                onChange={(e) =>
                  setForm({ ...form, isActive: e.target.value === "active" })
                }
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </motion.div>
          </div>
          <motion.div className="mt-6 flex gap-3" variants={modalItemVariants}>
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-emerald-500 to-teal-600 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                "Save changes"
              )}
            </button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    if (currentUser && currentUser.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
    fetchUsers();
  }, [currentUser, router]);

  async function fetchUsers() {
    try {
      const res = await api.users.list();
      setUsers(res.users);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleEdit(data: EditData) {
    if (!editingUser) return;
    const res = await api.users.update(editingUser.id, data);
    setUsers((prev) =>
      prev.map((u) => (u.id === editingUser.id ? { ...u, ...res.user } : u)),
    );
  }

  async function handleDelete(id: string) {
    setDeleteError("");
    setDeletingId(id);
    try {
      await api.users.delete(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeletingId(null);
      setUserToDelete(null);
    }
  }

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="brand-surface rounded-3xl p-1">
      {editingUser && (
        <EditModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleEdit}
        />
      )}

      <ActionConfirmModal
        open={userToDelete !== null}
        title="Delete User"
        description={
          userToDelete
            ? `Delete ${userToDelete.name}? This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        danger
        loading={deletingId !== null}
        onClose={() => {
          if (!deletingId) {
            setUserToDelete(null);
            setDeleteError("");
          }
        }}
        onConfirm={() => {
          if (userToDelete) {
            void handleDelete(userToDelete.id);
          }
        }}
      />

      {deleteError && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {deleteError}
        </div>
      )}

      {/* Header */}
      <div className="brand-glass mb-8 flex flex-col gap-4 rounded-3xl px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700/80">
            Admin Workspace
          </p>
          <h1 className="text-2xl font-extrabold text-gray-900">
            User Management
          </h1>
          <p className="text-gray-500 mt-1">{users.length} total users</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 text-sm font-medium px-4 py-2 rounded-xl border border-emerald-100">
          <Shield className="w-4 h-4" />
          Admin Panel
        </div>
      </div>

      {/* Search */}
      <div className="brand-glass relative mb-6 rounded-2xl p-1.5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full rounded-xl border border-emerald-100 bg-white/80 py-3 pl-11 pr-4 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Table */}
      <div className="brand-glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <UserPlus className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No users found.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <table className="w-full hidden md:table">
              <thead>
                <tr className="border-b border-emerald-100 bg-white/70">
                  <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3">
                    User
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3">
                    Role
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3">
                    Joined
                  </th>
                  <th className="text-right text-xs font-semibold text-gray-500 px-6 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-white/70">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 shrink-0 rounded-full bg-linear-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {u.name}
                          </p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "text-xs font-semibold px-2.5 py-1 rounded-full border",
                          getRoleColor(u.role),
                        )}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full",
                          u.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-500",
                        )}
                      >
                        {u.isActive ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-500">
                        {formatDate(u.createdAt)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingUser(u)}
                          className="p-2 rounded-lg hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors"
                          title="Edit user"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {u.id !== currentUser?.id && (
                          <button
                            onClick={() => setUserToDelete(u)}
                            disabled={deletingId === u.id}
                            className="p-2 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-500 transition-colors disabled:opacity-50"
                            title="Delete user"
                          >
                            {deletingId === u.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile cards */}
            <div className="divide-y divide-emerald-50/80 md:hidden">
              {filtered.map((u) => (
                <div
                  key={u.id}
                  className="p-4 transition-colors hover:bg-white/70"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-linear-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {u.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {u.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span
                      className={cn(
                        "text-xs font-semibold px-2.5 py-1 rounded-full border",
                        getRoleColor(u.role),
                      )}
                    >
                      {u.role}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full",
                        u.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-gray-100 text-gray-500",
                      )}
                    >
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDate(u.createdAt)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingUser(u)}
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                    >
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                    {u.id !== currentUser?.id && (
                      <button
                        onClick={() => setUserToDelete(u)}
                        disabled={deletingId === u.id}
                        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors disabled:opacity-50"
                      >
                        {deletingId === u.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}{" "}
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
