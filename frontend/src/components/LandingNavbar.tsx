"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import BrandLogo from "@/components/BrandLogo";

type NavItem = {
  href: string;
  label: string;
};

type LandingNavbarProps = {
  navItems?: NavItem[];
};

export default function LandingNavbar({ navItems }: LandingNavbarProps) {
  const { user, loading, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  const links: NavItem[] = navItems ?? [
    { href: "/#events", label: "Events" },
    { href: "/#features", label: "Features" },
    { href: "/#testimonials", label: "Testimonials" },
    { href: "/#pricing", label: "Pricing" },
    { href: "/#blogs", label: "Blogs" },
  ];

  const handleLogout = async () => {
    setMenuOpen(false);
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  const handleNavLinkClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    href: string,
    closeMenu = false,
  ) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    if (closeMenu) setMenuOpen(false);

    // Smooth scroll for section links while already on home.
    if (href.startsWith("/#") && window.location.pathname === "/") {
      event.preventDefault();
      const id = href.slice(2);
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        window.history.replaceState(null, "", href);
      }
    }
  };

  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (navRef.current && !navRef.current.contains(target)) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [menuOpen]);

  return (
    <nav
      ref={navRef}
      className="fixed top-0 inset-x-0 z-50 border-b border-emerald-100/70 bg-white/70 backdrop-blur-md"
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          onClick={(event) => handleNavLinkClick(event, "/")}
          className="transition-opacity hover:opacity-90"
        >
          <BrandLogo textClassName="text-lg" />
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={(event) => handleNavLinkClick(event, item.href)}
              className="hover:text-gray-900 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {loading ? (
            <div className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking session...
            </div>
          ) : user ? (
            <>
              <Link
                href="/dashboard"
                onClick={(event) => handleNavLinkClick(event, "/dashboard")}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-4 py-2"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="text-sm font-semibold bg-linear-to-r from-rose-500 to-pink-600 text-white px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity shadow-sm disabled:opacity-60"
              >
                {loggingOut ? "Signing out..." : "Sign Out"}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/sign-in?force=1"
                onClick={(event) =>
                  handleNavLinkClick(event, "/auth/sign-in?force=1")
                }
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-4 py-2"
              >
                Sign In
              </Link>
              <Link
                href="/auth/sign-up?force=1"
                onClick={(event) =>
                  handleNavLinkClick(event, "/auth/sign-up?force=1")
                }
                className="text-sm font-semibold bg-linear-to-r from-emerald-700 to-teal-600 text-white px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity shadow-sm"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((prev) => !prev)}
          className="md:hidden relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white/90 text-gray-700 shadow-sm"
        >
          <span
            className={`absolute h-0.5 w-5 rounded-full bg-current transition-all duration-300 ${
              menuOpen ? "rotate-45" : "-translate-y-1.5"
            }`}
          />
          <span
            className={`absolute h-0.5 w-5 rounded-full bg-current transition-all duration-200 ${
              menuOpen ? "opacity-0" : "opacity-100"
            }`}
          />
          <span
            className={`absolute h-0.5 w-5 rounded-full bg-current transition-all duration-300 ${
              menuOpen ? "-rotate-45" : "translate-y-1.5"
            }`}
          />
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="md:hidden border-t border-gray-100 bg-white/95 px-6 py-4 backdrop-blur-md"
          >
            <div className="space-y-1">
              {links.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(event) =>
                    handleNavLinkClick(event, item.href, true)
                  }
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="mt-4 border-t border-gray-100 pt-4">
              {loading ? (
                <div className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking session...
                </div>
              ) : user ? (
                <div className="grid grid-cols-1 gap-2">
                  <Link
                    href="/dashboard"
                    onClick={(event) =>
                      handleNavLinkClick(event, "/dashboard", true)
                    }
                    className="rounded-xl border border-gray-200 px-3 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="rounded-xl bg-linear-to-r from-rose-500 to-pink-600 px-3 py-2 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
                  >
                    {loggingOut ? "Signing out..." : "Sign Out"}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/auth/sign-in?force=1"
                    onClick={(event) =>
                      handleNavLinkClick(event, "/auth/sign-in?force=1", true)
                    }
                    className="rounded-xl border border-gray-200 px-3 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/sign-up?force=1"
                    onClick={(event) =>
                      handleNavLinkClick(event, "/auth/sign-up?force=1", true)
                    }
                    className="rounded-xl bg-linear-to-r from-emerald-700 to-teal-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
