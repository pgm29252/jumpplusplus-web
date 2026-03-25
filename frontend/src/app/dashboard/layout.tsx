"use client";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  LogOut,
  Rocket,
  Menu,
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

const navItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/users", label: "Users", icon: Users, adminOnly: true },
  {
    href: "/dashboard/manage-events",
    label: "Manage Events",
    icon: Settings2,
    staffOnly: true,
  },
  {
    href: "/dashboard/manage-bookings",
    label: "Manage Bookings",
    icon: Calendar,
    staffOnly: true,
  },
  { href: "/dashboard/bookings", label: "Book Event", icon: Calendar },
  { href: "/dashboard/my-bookings", label: "My Bookings", icon: BookOpen },
];

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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center animate-pulse">
            <Rocket className="w-5 h-5 text-white" />
          </div>
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
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

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <Rocket className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-900">JumpPlusPlus</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {filteredNav.map((item) => {
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
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
              {active && (
                <ChevronRight className="w-3 h-3 ml-auto text-indigo-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-4 pb-6 border-t border-gray-100 pt-4">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-white border-r border-gray-100 fixed inset-y-0">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl z-50">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-64 min-h-screen">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between bg-white border-b border-gray-100 px-4 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Rocket className="w-3 h-3 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-sm">
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
