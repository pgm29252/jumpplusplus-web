"use client";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  LogOut,
  X,
  ChevronRight,
  Calendar,
  BookOpen,
  Settings2,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import BrandLogo from "@/components/BrandLogo";

const navItems = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
    exact: true,
    group: "general",
  },
  {
    href: "/dashboard/users",
    label: "Users",
    icon: Users,
    adminOnly: true,
    group: "management",
  },
  {
    href: "/dashboard/manage-events",
    label: "Manage Events",
    icon: Settings2,
    staffOnly: true,
    group: "management",
  },
  {
    href: "/dashboard/manage-bookings",
    label: "Manage Bookings",
    icon: Calendar,
    staffOnly: true,
    group: "management",
  },
  {
    href: "/dashboard/bookings",
    label: "Book Event",
    icon: Calendar,
    group: "bookings",
  },
  {
    href: "/dashboard/my-bookings",
    label: "My Bookings",
    icon: BookOpen,
    group: "bookings",
  },
];

const navGroups = [
  { id: "general", label: "General" },
  { id: "management", label: "Management" },
  { id: "bookings", label: "Bookings" },
] as const;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/sign-in");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <BrandLogo
            iconClassName="h-10 w-10 rounded-xl animate-pulse"
            showText={false}
          />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
          <p className="text-sm text-gray-500">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const filteredNav = navItems.filter((item) => {
    if (item.adminOnly) return user.role === "ADMIN";
    if (item.staffOnly)
      return user.role === "ADMIN" || user.role === "MODERATOR";
    return true;
  });

  const navByGroup = navGroups
    .map((group) => ({
      ...group,
      items: filteredNav.filter((item) => item.group === group.id),
    }))
    .filter((group) => group.items.length > 0);

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="border-b border-emerald-100/80 px-6 py-5">
        <Link href="/" className="flex items-center gap-2">
          <BrandLogo />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-4 py-6">
        <div className="space-y-5">
          {navByGroup.map((group) => (
            <section
              key={group.id}
              className="rounded-2xl border border-emerald-100/70 bg-white/50 p-2 backdrop-blur-sm"
            >
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-emerald-700/70">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const active = item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                        active
                          ? "bg-linear-to-r from-emerald-100 to-teal-100 text-emerald-900 shadow-sm"
                          : "text-gray-600 hover:bg-white/80 hover:text-gray-900",
                      )}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      {item.label}
                      {active && (
                        <ChevronRight className="ml-auto h-3 w-3 text-emerald-500" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </nav>

      {/* User */}
      <div className="border-t border-emerald-100/80 px-4 pb-6 pt-4">
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-emerald-100/70 bg-white/60 px-3 py-2 backdrop-blur-sm">
          <div className="w-8 h-8 rounded-full bg-linear-to-br from-emerald-600 to-teal-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {user.name}
            </p>
            <p className="text-xs text-gray-500 truncate">{user.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-rose-50 hover:text-rose-600 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="brand-surface min-h-screen flex">
      {/* Desktop sidebar */}
      <aside className="brand-glass-strong fixed inset-y-0 hidden w-64 border-r border-emerald-100/70 lg:flex lg:flex-col">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <motion.div
              className="absolute inset-0 bg-black/25 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -32, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -32, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="brand-glass-strong absolute bottom-0 left-0 top-0 z-50 w-72 shadow-xl"
            >
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
              <Sidebar />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="flex-1 lg:ml-64 min-h-screen">
        {/* Mobile top bar */}
        <div className="brand-glass-strong lg:hidden flex items-center justify-between border-b border-emerald-100/70 px-4 py-3">
          <button
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="group flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100"
            aria-label={sidebarOpen ? "Close menu" : "Open menu"}
          >
            <span className="relative block h-4 w-5">
              <span
                className={cn(
                  "absolute left-0 top-0.5 block h-0.5 w-5 origin-center rounded-full bg-current transition-all duration-200",
                  sidebarOpen && "top-[7px] rotate-45",
                )}
              />
              <span
                className={cn(
                  "absolute left-0 top-[7px] block h-0.5 w-5 rounded-full bg-current transition-all duration-200",
                  sidebarOpen && "opacity-0",
                )}
              />
              <span
                className={cn(
                  "absolute left-0 top-[13px] block h-0.5 w-5 origin-center rounded-full bg-current transition-all duration-200",
                  sidebarOpen && "top-[7px] -rotate-45",
                )}
              />
            </span>
          </button>
          <div className="flex items-center gap-2">
            <BrandLogo showText={false} iconClassName="h-6 w-6 rounded-lg" />
            <span className="text-sm font-bold text-gray-900">
              JumpPlusPlus
            </span>
          </div>
          <div className="w-9" />
        </div>

        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
