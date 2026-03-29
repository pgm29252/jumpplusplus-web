"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, Loader2, PenLine } from "lucide-react";
import { api, Blog } from "@/lib/api";
import LandingNavbar from "@/components/LandingNavbar";
import Breadcrumb from "@/components/Breadcrumb";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.blogs.list();
        setBlogs(data.blogs);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load blogs");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <main className="brand-surface min-h-screen px-6 pb-20 pt-28">
      <LandingNavbar />
      <div className="mx-auto max-w-7xl">
        <Breadcrumb
          items={[{ label: "Home", href: "/" }, { label: "Blogs" }]}
        />
        <div className="brand-glass mb-8 rounded-3xl px-6 py-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700/80">
            JumpPlusPlus Blog
          </p>
          <h1 className="text-3xl font-extrabold text-gray-900">
            Latest Posts
          </h1>
          <p className="mt-2 text-sm text-gray-600 sm:text-base">
            Product updates, event playbooks, and practical guides from our
            team.
          </p>
        </div>

        {loading && (
          <div className="brand-glass flex items-center justify-center rounded-2xl py-16 text-gray-600">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-emerald-600" />
            Loading blog feed...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        {!loading && !error && blogs.length === 0 && (
          <div className="brand-glass rounded-2xl px-5 py-14 text-center text-gray-600">
            No blog posts published yet.
          </div>
        )}

        {!loading && !error && blogs.length > 0 && (
          <div className="space-y-4">
            {blogs.map((blog) => (
              <article
                key={blog.id}
                className="brand-glass overflow-hidden rounded-2xl"
              >
                <div className="flex flex-col sm:flex-row">
                  {blog.coverImageUrl && (
                    <div className="h-48 w-full shrink-0 sm:h-auto sm:w-56">
                      <img
                        src={blog.coverImageUrl}
                        alt={blog.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col justify-between p-5">
                    <div>
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
                      <h2 className="text-xl font-bold text-gray-900">
                        {blog.title}
                      </h2>
                      {blog.excerpt && (
                        <p className="mt-2 line-clamp-3 text-sm text-gray-600">
                          {blog.excerpt}
                        </p>
                      )}
                    </div>
                    <div className="mt-4">
                      <Link
                        href={`/blogs/${blog.slug}`}
                        className="inline-flex items-center rounded-lg bg-linear-to-r from-emerald-700 to-teal-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                      >
                        Read detail
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
