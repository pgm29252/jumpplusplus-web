"use client";

import { FormEvent, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import BlogContentEditor from "@/components/BlogContentEditor";
import ToastNotice from "@/components/ui/ToastNotice";
import DashboardPageLayout from "@/components/dashboard/DashboardPageLayout";

export default function CreateBlogPage() {
  const { user, loading: authLoading } = useAuth();

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [editorKey, setEditorKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{
    open: boolean;
    tone: "success" | "error";
    message: string;
  }>({ open: false, tone: "success", message: "" });
  const contentRef = useRef("");

  const canManageBlogs = user?.role === "ADMIN" || user?.role === "MODERATOR";

  const isEditorContentEmpty = (html: string) =>
    html
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim().length === 0;

  const showToast = (tone: "success" | "error", message: string) => {
    setToast({ open: true, tone, message });
    window.setTimeout(() => {
      setToast((prev) => ({ ...prev, open: false }));
    }, 1800);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const content = contentRef.current;
    if (isEditorContentEmpty(content)) {
      showToast("error", "Content is required");
      return;
    }

    setSubmitting(true);

    try {
      const res = await api.blogs.create({
        title,
        excerpt: excerpt || undefined,
        content,
        coverImageUrl: coverImageUrl || undefined,
        isPublished,
      });

      showToast("success", `Blog created: ${res.blog.title}`);
      setTitle("");
      setExcerpt("");
      contentRef.current = "";
      setCoverImageUrl("");
      setIsPublished(true);
      setEditorKey((k) => k + 1);
    } catch (err) {
      showToast(
        "error",
        err instanceof Error ? err.message : "Failed to create blog",
      );
    } finally {
      setSubmitting(false);
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
          You do not have permission to create blogs.
        </div>
      </div>
    );
  }

  return (
    <DashboardPageLayout
      breadcrumbItems={[
        { label: "Dashboard", href: "/dashboard" },
        { label: "Manage Blogs", href: "/dashboard/blogs" },
        { label: "Create Blog" },
      ]}
    >
      <div className="brand-glass rounded-3xl px-6 py-5">
        <div className="mb-3">
          <Link
            href="/dashboard/blogs"
            className="inline-flex items-center gap-1 rounded-lg border border-emerald-100 bg-white/70 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-emerald-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to manage blogs
          </Link>
        </div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700/80">
          Content Studio
        </p>
        <h1 className="text-2xl font-bold text-gray-900">Create Blog</h1>
        <p className="mt-1 text-sm text-gray-600">
          Publish updates and stories to the public blog feed.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="rounded-3xl border border-emerald-100 bg-white/75 p-6 shadow-sm"
      >
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Title
            </label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-emerald-100 bg-white/80 px-4 py-3 text-sm text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Write a clear blog title"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Excerpt
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={2}
              className="w-full resize-none rounded-xl border border-emerald-100 bg-white/80 px-4 py-3 text-sm text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Short preview shown in blog feed"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Cover Image URL
            </label>
            <input
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              className="w-full rounded-xl border border-emerald-100 bg-white/80 px-4 py-3 text-sm text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="https://example.com/cover.jpg"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Content
            </label>
            <div className="rounded-xl border border-emerald-100 bg-white/80">
              <BlogContentEditor
                key={editorKey}
                defaultValue=""
                onChange={(value) => {
                  contentRef.current = value;
                }}
              />
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            Public blog (uncheck to keep private)
          </label>
        </div>

        <div className="sticky bottom-0 mt-6 -mx-6 border-t border-emerald-100 bg-white/75 px-6 py-4 backdrop-blur-sm">
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-linear-to-r from-emerald-700 to-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                "Create blog"
              )}
            </button>
          </div>
        </div>
      </form>

      <ToastNotice
        open={toast.open}
        tone={toast.tone}
        message={toast.message}
      />
    </DashboardPageLayout>
  );
}
