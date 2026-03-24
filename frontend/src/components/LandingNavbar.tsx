"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2, Rocket } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function LandingNavbar() {
  const { user, loading, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      document.cookie = "token=; path=/; max-age=0; SameSite=Lax";
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <Rocket className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            JumpPlusPlus
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <a href="#events" className="hover:text-gray-900 transition-colors">
            Events
          </a>
          <a href="#features" className="hover:text-gray-900 transition-colors">
            Features
          </a>
          <a href="#pricing" className="hover:text-gray-900 transition-colors">
            Pricing
          </a>
          <a
            href="#testimonials"
            className="hover:text-gray-900 transition-colors"
          >
            Reviews
          </a>
        </div>

        <div className="flex items-center gap-3">
          {loading ? (
            <div className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking session...
            </div>
          ) : user ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-4 py-2"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="text-sm font-semibold bg-gradient-to-r from-rose-500 to-pink-600 text-white px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity shadow-sm disabled:opacity-60"
              >
                {loggingOut ? "Signing out..." : "Sign Out"}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/sign-in"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-4 py-2"
              >
                Sign In
              </Link>
              <Link
                href="/auth/sign-up"
                className="text-sm font-semibold bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity shadow-sm"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
