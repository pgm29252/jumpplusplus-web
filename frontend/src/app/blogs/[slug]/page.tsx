"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarDays, Loader2, PenLine } from "lucide-react";
import { api, Blog } from "@/lib/api";
import LandingNavbar from "@/components/LandingNavbar";
import Breadcrumb from "@/components/Breadcrumb";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogDetailPage() {
  const params = useParams<{ slug: string }>();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [suggestedBlogs, setSuggestedBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [detailData, listData] = await Promise.all([
          api.blogs.get(params.slug),
          api.blogs.list(),
        ]);

        setBlog(detailData.blog);

        const suggested = listData.blogs
          .filter((item) => item.slug !== detailData.blog.slug)
          .sort((a, b) => {
            const authorMatchA =
              a.author.id === detailData.blog.author.id ? 1 : 0;
            const authorMatchB =
              b.author.id === detailData.blog.author.id ? 1 : 0;
            if (authorMatchA !== authorMatchB)
              return authorMatchB - authorMatchA;
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          })
          .slice(0, 3);

        setSuggestedBlogs(suggested);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load blog");
      } finally {
        setLoading(false);
      }
    };

    if (params.slug) {
      load();
    }
  }, [params.slug]);

  return (
    <main className="brand-surface min-h-screen px-6 pb-20 pt-28">
      <LandingNavbar />
      <div className="mx-auto max-w-7xl">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Blogs", href: "/blogs" },
            { label: blog?.title || "Blog" },
          ]}
        />
        <Link
          href="/blogs"
          className="mb-6 inline-flex items-center gap-2 rounded-lg border border-emerald-100 bg-white/70 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-emerald-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to blogs
        </Link>

        {loading && (
          <div className="brand-glass flex items-center justify-center rounded-2xl py-16 text-gray-600">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-emerald-600" />
            Loading blog detail...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        {!loading && !error && blog && (
          <div className="space-y-6">
            <article className="brand-glass rounded-3xl p-6 sm:p-8">
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

              <h1 className="text-3xl font-extrabold text-gray-900">
                {blog.title}
              </h1>
              {blog.excerpt && (
                <p className="mt-3 rounded-xl border border-emerald-100/70 bg-white/65 px-4 py-3 text-sm text-gray-600">
                  {blog.excerpt}
                </p>
              )}

              {blog.coverImageUrl && (
                <div className="relative mt-5 h-64 overflow-hidden rounded-2xl border border-emerald-100 sm:h-80">
                  <Image
                    src={blog.coverImageUrl}
                    alt={blog.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}

              <div className="prose prose-sm mt-6 max-w-none text-gray-700 leading-relaxed prose-headings:text-gray-900 prose-a:text-emerald-700 prose-img:rounded-xl prose-img:border prose-img:border-emerald-100 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_li]:my-1 [&_li]:leading-7 [&_p]:leading-7 sm:prose-base">
                {blog.content ? (
                  <div dangerouslySetInnerHTML={{ __html: blog.content }} />
                ) : (
                  <p className="text-sm text-gray-500">No content</p>
                )}
              </div>
            </article>

            {suggestedBlogs.length > 0 && (
              <section className="brand-glass rounded-3xl p-6">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700/80">
                  Suggested Blogs
                </p>
                <h2 className="text-xl font-bold text-gray-900">
                  Keep Reading
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {suggestedBlogs.map((item) => (
                    <article
                      key={item.id}
                      className="overflow-hidden rounded-2xl border border-emerald-100 bg-white/75"
                    >
                      {item.coverImageUrl && (
                        <div className="relative h-36 w-full">
                          <Image
                            src={item.coverImageUrl}
                            alt={item.title}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      )}
                      <div className="space-y-2 p-4">
                        <p className="text-xs text-gray-500">
                          {formatDate(item.createdAt)}
                        </p>
                        <h3 className="line-clamp-2 text-sm font-semibold text-gray-900">
                          {item.title}
                        </h3>
                        {item.excerpt && (
                          <p className="line-clamp-2 text-xs text-gray-600">
                            {item.excerpt}
                          </p>
                        )}
                        <Link
                          href={`/blogs/${item.slug}`}
                          className="inline-flex items-center rounded-lg bg-linear-to-r from-emerald-700 to-teal-600 px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                        >
                          Read blog
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
