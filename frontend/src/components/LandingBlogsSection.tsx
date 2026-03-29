"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, ChevronRight, Loader2, PenLine } from "lucide-react";
import { api, Blog } from "@/lib/api";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function LandingBlogsSection() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadBlogs = async () => {
      try {
        const data = await api.blogs.list();
        setBlogs(data.blogs.slice(0, 3));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load blogs");
      } finally {
        setLoading(false);
      }
    };

    void loadBlogs();
  }, []);

  return (
    <section id="blogs" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-500">
              From The Blog
            </p>
            <h2 className="mb-3 text-4xl font-extrabold text-gray-900">
              Fresh stories and practical insights
            </h2>
            <p className="max-w-2xl text-lg text-gray-500">
              Read product updates, event playbooks, and tips from our team.
            </p>
          </div>
          <Link
            href="/blogs"
            className="inline-flex items-center justify-center gap-1 rounded-2xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            See all blogs
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {loading && (
          <div className="brand-glass flex items-center justify-center rounded-3xl py-16">
            <div className="flex items-center gap-3 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
              Loading blogs...
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        {!loading && !error && blogs.length === 0 && (
          <div className="brand-glass rounded-3xl py-16 text-center text-gray-500">
            No blogs published yet.
          </div>
        )}

        {!loading && !error && blogs.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {blogs.map((blog) => (
              <article
                key={blog.id}
                className="brand-glass overflow-hidden rounded-3xl p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-50"
              >
                {blog.coverImageUrl && (
                  <div className="mb-4 h-44 overflow-hidden rounded-2xl border border-emerald-100">
                    <img
                      src={blog.coverImageUrl}
                      alt={blog.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}

                <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5 text-emerald-600" />
                    {formatDate(blog.createdAt)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <PenLine className="h-3.5 w-3.5 text-emerald-600" />
                    {blog.author.name}
                  </span>
                </div>

                <h3 className="line-clamp-2 text-xl font-bold text-gray-900">
                  {blog.title}
                </h3>

                {blog.excerpt && (
                  <p className="mt-2 line-clamp-3 text-sm text-gray-600">
                    {blog.excerpt}
                  </p>
                )}

                <div className="mt-5">
                  <Link
                    href={`/blogs/${blog.slug}`}
                    className="inline-flex items-center rounded-lg bg-linear-to-r from-emerald-700 to-teal-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    Read detail
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
