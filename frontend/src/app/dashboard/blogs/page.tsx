"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Copy,
  Eye,
  EyeOff,
  Loader2,
  Pencil,
  Trash2,
  X,
  ExternalLink,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { api, Blog } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import ActionConfirmModal from "@/components/ui/ActionConfirmModal";
import ToastNotice from "@/components/ui/ToastNotice";
import DashboardPageLayout from "@/components/dashboard/DashboardPageLayout";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ManageBlogsPage() {
  const { user, loading: authLoading } = useAuth();

  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loadingBlogs, setLoadingBlogs] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [viewingBlog, setViewingBlog] = useState<Blog | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<Blog | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionToast, setActionToast] = useState<{
    open: boolean;
    tone: "success" | "error";
    message: string;
  }>({ open: false, tone: "success", message: "" });

  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canManageBlogs = user?.role === "ADMIN" || user?.role === "MODERATOR";

  const loadBlogs = async () => {
    try {
      const res = await api.blogs.listAll();
      setBlogs(res.blogs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load blogs");
    } finally {
      setLoadingBlogs(false);
    }
  };

  useEffect(() => {
    if (!authLoading && canManageBlogs) {
      void loadBlogs();
    } else if (!authLoading) {
      setLoadingBlogs(false);
    }
  }, [authLoading, canManageBlogs]);

  useEffect(() => {
    if (!viewingBlog) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setViewingBlog(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [viewingBlog]);

  const handleDuplicate = async (blog: Blog) => {
    setActionLoadingId(blog.id);
    setSuccess(null);
    setError(null);

    try {
      const res = await api.blogs.duplicate(blog.id);
      setActionToast({
        open: true,
        tone: "success",
        message: `Blog duplicated: "${res.blog.title}" (saved as private draft)`,
      });
      window.setTimeout(() => {
        setActionToast((prev) => ({ ...prev, open: false }));
      }, 1800);
      await loadBlogs();
    } catch (err) {
      setActionToast({
        open: true,
        tone: "error",
        message:
          err instanceof Error ? err.message : "Failed to duplicate blog",
      });
      window.setTimeout(() => {
        setActionToast((prev) => ({ ...prev, open: false }));
      }, 1800);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async () => {
    const blog = confirmingDelete;
    if (!blog) return;
    setDeleting(true);
    setSuccess(null);
    setError(null);

    try {
      await api.blogs.remove(blog.id);
      setActionToast({
        open: true,
        tone: "success",
        message: `Blog removed: ${blog.title}`,
      });
      window.setTimeout(() => {
        setActionToast((prev) => ({ ...prev, open: false }));
      }, 1800);
      if (viewingBlog?.id === blog.id) setViewingBlog(null);
      setConfirmingDelete(null);
      await loadBlogs();
    } catch (err) {
      setActionToast({
        open: true,
        tone: "error",
        message: err instanceof Error ? err.message : "Failed to remove blog",
      });
      window.setTimeout(() => {
        setActionToast((prev) => ({ ...prev, open: false }));
      }, 1800);
    } finally {
      setDeleting(false);
      setActionLoadingId(null);
    }
  };

  const toggleVisibility = async (blog: Blog) => {
    setActionLoadingId(blog.id);
    setSuccess(null);
    setError(null);

    try {
      const res = await api.blogs.update(blog.id, {
        isPublished: !blog.isPublished,
      });
      setActionToast({
        open: true,
        tone: "success",
        message: `Blog is now ${res.blog.isPublished ? "public" : "private"}: ${res.blog.title}`,
      });
      window.setTimeout(() => {
        setActionToast((prev) => ({ ...prev, open: false }));
      }, 1800);
      await loadBlogs();
    } catch (err) {
      setActionToast({
        open: true,
        tone: "error",
        message:
          err instanceof Error
            ? err.message
            : "Failed to change visibility settings",
      });
      window.setTimeout(() => {
        setActionToast((prev) => ({ ...prev, open: false }));
      }, 1800);
    } finally {
      setActionLoadingId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!canManageBlogs) {
    return (
      <div className="brand-surface min-h-screen p-6">
        <div className="mx-auto max-w-4xl rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          You do not have permission to manage blogs.
        </div>
      </div>
    );
  }

  return (
    <DashboardPageLayout
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Manage Blogs" },
      ]}
    >
        <div className="brand-glass rounded-3xl px-6 py-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700/80">
            Content Studio
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Manage Blogs</h1>
            <Link
              href="/dashboard/blogs/create"
              className="inline-flex items-center rounded-lg bg-linear-to-r from-emerald-700 to-teal-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Create New Blog
            </Link>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Edit, review, publish/private, and remove blog posts.
          </p>
        </div>

        {(success || error) && (
          <div
            className={`rounded-2xl border px-5 py-4 text-sm ${
              success
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {success ?? error}
          </div>
        )}

        <section className="brand-glass rounded-3xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Blog List ({blogs.length})
            </h2>
            {loadingBlogs && (
              <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
            )}
          </div>

          {!loadingBlogs && blogs.length === 0 && (
            <p className="rounded-xl border border-emerald-100 bg-white/70 px-4 py-6 text-center text-sm text-gray-600">
              No blogs found. Create your first post from the button above.
            </p>
          )}

          <div className="space-y-3">
            {blogs.map((blog) => {
              const busy = actionLoadingId === blog.id;
              return (
                <article
                  key={blog.id}
                  className="overflow-hidden rounded-2xl border border-emerald-100 bg-white/75 backdrop-blur-sm"
                >
                  <div className="flex items-start gap-0">
                    {blog.coverImageUrl && (
                      <div className="h-24 w-28 shrink-0 sm:h-28 sm:w-36">
                        <img
                          src={blog.coverImageUrl}
                          alt={blog.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex flex-1 flex-wrap items-start justify-between gap-3 p-4">
                      <div>
                        <h3 className="text-base font-bold text-gray-900">
                          {blog.title}
                        </h3>
                        <p className="mt-1 text-xs text-gray-500">
                          {blog.isPublished ? "Public" : "Private"} ·{" "}
                          {formatDate(blog.createdAt)} · by {blog.author.name}
                        </p>
                        {blog.excerpt && (
                          <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                            {blog.excerpt}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setViewingBlog(blog)}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-100 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-emerald-50"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>

                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleDuplicate(blog)}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-100 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {busy ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                          Duplicate
                        </button>

                        <Link
                          href={`/dashboard/blogs/${blog.id}/edit`}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-100 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-emerald-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Link>

                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void toggleVisibility(blog)}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-100 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {blog.isPublished ? (
                            <>
                              <EyeOff className="h-3.5 w-3.5" />
                              Set Private
                            </>
                          ) : (
                            <>
                              <Eye className="h-3.5 w-3.5" />
                              Set Public
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setConfirmingDelete(blog)}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {busy ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

      <ActionConfirmModal
        open={confirmingDelete !== null}
        title="Remove blog post?"
        description={`You are about to permanently delete "${confirmingDelete?.title}". This action cannot be undone.`}
        confirmLabel="Yes, remove"
        danger
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onClose={() => {
          if (!deleting) setConfirmingDelete(null);
        }}
      />

      <ToastNotice
        open={actionToast.open}
        tone={actionToast.tone}
        message={actionToast.message}
      />

      <AnimatePresence>
        {viewingBlog && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-gray-900/45 backdrop-blur-sm"
              onClick={() => setViewingBlog(null)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            <motion.div
              className="brand-glass-strong relative w-full max-w-4xl overflow-hidden rounded-2xl border border-emerald-100"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <div className="sticky top-0 z-10 border-b border-emerald-100 bg-white/85 px-6 py-4 backdrop-blur-sm">
                <button
                  type="button"
                  onClick={() => setViewingBlog(null)}
                  className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-500 hover:bg-emerald-50 hover:text-gray-700"
                  aria-label="Close preview"
                >
                  <X className="h-4 w-4" />
                </button>

                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700/80">
                  Blog Preview
                </p>
                <h3 className="pr-10 text-2xl font-bold text-gray-900">
                  {viewingBlog.title}
                </h3>

                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
                    {viewingBlog.isPublished ? "Public" : "Private"}
                  </span>
                  <span className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-gray-600">
                    Author: {viewingBlog.author.name}
                  </span>
                  {viewingBlog.author.email && (
                    <span className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-gray-600">
                      {viewingBlog.author.email}
                    </span>
                  )}
                  <span className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-gray-600">
                    Slug: {viewingBlog.slug}
                  </span>
                </div>
              </div>

              <div className="max-h-[58vh] space-y-4 overflow-y-auto px-6 py-5 sm:max-h-[62vh]">
                <div className="grid gap-3 rounded-xl border border-emerald-100 bg-white/70 p-4 text-xs text-gray-600 sm:grid-cols-2">
                  <p>
                    <span className="font-semibold text-gray-800">
                      Created:
                    </span>{" "}
                    {formatDateTime(viewingBlog.createdAt)}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-800">
                      Updated:
                    </span>{" "}
                    {formatDateTime(viewingBlog.updatedAt)}
                  </p>
                  <p className="sm:col-span-2">
                    <span className="font-semibold text-gray-800">ID:</span>{" "}
                    {viewingBlog.id}
                  </p>
                </div>

                {viewingBlog.coverImageUrl && (
                  <div className="overflow-hidden rounded-xl border border-emerald-100 bg-white/70">
                    <img
                      src={viewingBlog.coverImageUrl}
                      alt={viewingBlog.title}
                      className="h-56 w-full object-cover sm:h-72"
                    />
                  </div>
                )}

                {viewingBlog.excerpt && (
                  <p className="rounded-xl border border-emerald-100 bg-white/70 px-4 py-3 text-sm text-gray-600">
                    {viewingBlog.excerpt}
                  </p>
                )}

                <div className="prose prose-sm max-w-none rounded-xl border border-emerald-100 bg-white/70 px-4 py-4 text-gray-700 leading-relaxed [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_li]:my-1 [&_li]:leading-7 [&_p]:leading-7">
                  {viewingBlog.content ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: viewingBlog.content }}
                    />
                  ) : (
                    <p className="m-0 text-sm text-gray-500">No content</p>
                  )}
                </div>
              </div>

              <div className="sticky bottom-0 z-10 border-t border-emerald-100 bg-white/85 px-6 py-4 backdrop-blur-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/blogs/${viewingBlog.slug}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-100 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-emerald-50"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open public page
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardPageLayout>
  );
}
