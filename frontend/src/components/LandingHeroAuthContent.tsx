"use client";

import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function LandingHeroAuthContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white/80 px-4 py-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Checking your session...
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          Welcome back{user.name ? `, ${user.name}` : ""}. Continue managing
          your events and bookings from your dashboard.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/dashboard"
            className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold text-base px-8 py-4 rounded-2xl hover:opacity-90 transition-all shadow-lg shadow-indigo-200"
          >
            Go to dashboard
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/dashboard/bookings"
            className="inline-flex items-center justify-center gap-2 bg-gray-50 text-gray-700 font-semibold text-base px-8 py-4 rounded-2xl hover:bg-gray-100 transition-all border border-gray-200"
          >
            Book an event
          </Link>
        </div>
        <p className="mt-6 text-sm text-gray-400">
          You are signed in and ready to continue.
        </p>
      </>
    );
  }

  return (
    <>
      <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
        A production-ready full-stack starter with authentication, role
        management, and a beautiful dashboard.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/auth/sign-up"
          className="group inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold text-base px-8 py-4 rounded-2xl hover:opacity-90 transition-all shadow-lg shadow-indigo-200"
        >
          Start for free
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
        <Link
          href="/auth/sign-in?force=1"
          className="inline-flex items-center justify-center gap-2 bg-gray-50 text-gray-700 font-semibold text-base px-8 py-4 rounded-2xl hover:bg-gray-100 transition-all border border-gray-200"
        >
          Sign in
        </Link>
      </div>
      <p className="mt-6 text-sm text-gray-400">
        No credit card required · Free forever on Starter plan
      </p>
    </>
  );
}
