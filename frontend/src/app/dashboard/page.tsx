"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Shield,
  UserCheck,
  TrendingUp,
  Activity,
  CalendarDays,
  BookOpen,
  Settings2,
  ArrowRight,
} from "lucide-react";
import { api, User, UserStats } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { formatDate, getRoleColor } from "@/lib/utils";

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  bg: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div
          className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}
        >
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
      <p className="text-2xl font-extrabold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}

function SummaryChart({
  items,
}: {
  items: Array<{ label: string; value: number; color: string; track: string }>;
}) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h3 className="text-sm font-bold text-gray-900 mb-4">Summary Chart</h3>
      <div className="space-y-4">
        {items.map((item) => {
          const width = `${Math.max(8, (item.value / max) * 100)}%`;
          return (
            <div key={item.label}>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="font-medium text-gray-600">{item.label}</span>
                <span className="font-bold text-gray-900">{item.value}</span>
              </div>
              <div className={`h-2.5 w-full rounded-full ${item.track}`}>
                <div
                  className={`h-full rounded-full ${item.color} transition-all duration-500`}
                  style={{ width }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summary, setSummary] = useState({
    totalEvents: 0,
    activeEvents: 0,
    totalBookings: 0,
    upcomingBookings: 0,
  });

  useEffect(() => {
    if (user?.role === "ADMIN") {
      setLoadingStats(true);
      Promise.all([api.users.stats(), api.users.list()])
        .then(([statsRes, usersRes]) => {
          setStats(statsRes.stats);
          setRecentUsers(usersRes.users.slice(0, 5));
        })
        .catch(console.error)
        .finally(() => setLoadingStats(false));
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    setLoadingSummary(true);
    const loadSummary = async () => {
      try {
        const [eventsRes, bookingsRes] =
          user.role === "ADMIN" || user.role === "MODERATOR"
            ? await Promise.all([api.events.listAll(), api.bookings.listAll()])
            : await Promise.all([api.events.list(), api.bookings.list()]);

        const now = new Date();
        const totalEvents = eventsRes.events.length;
        const activeEvents = eventsRes.events.filter(
          (event) => event.isActive !== false,
        ).length;
        const totalBookings = bookingsRes.bookings.length;
        const upcomingBookings = bookingsRes.bookings.filter(
          (booking) =>
            booking.status !== "CANCELLED" && new Date(booking.startTime) > now,
        ).length;

        setSummary({
          totalEvents,
          activeEvents,
          totalBookings,
          upcomingBookings,
        });
      } catch {
        setSummary({
          totalEvents: 0,
          activeEvents: 0,
          totalBookings: 0,
          upcomingBookings: 0,
        });
      } finally {
        setLoadingSummary(false);
      }
    };

    void loadSummary();
  }, [user]);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const quickLinks = [
    { href: "/dashboard/bookings", label: "Book Event", show: true },
    { href: "/dashboard/my-bookings", label: "My Bookings", show: true },
    {
      href: "/dashboard/manage-events",
      label: "Manage Events",
      show: user?.role === "ADMIN" || user?.role === "MODERATOR",
    },
    {
      href: "/dashboard/manage-bookings",
      label: "Manage Bookings",
      show: user?.role === "ADMIN" || user?.role === "MODERATOR",
    },
    { href: "/dashboard/users", label: "Users", show: user?.role === "ADMIN" },
  ].filter((item) => item.show);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900">
          {greeting}, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-gray-500 mt-1">
          Here&apos;s what&apos;s happening on your platform today.
        </p>
      </div>

      {/* Section: Overview */}
      <section className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-sky-600" />
          <h2 className="text-lg font-bold text-gray-900">Overview Summary</h2>
        </div>

        {loadingSummary ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-5 border border-gray-100 h-28 animate-pulse"
                />
              ))}
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 h-64 animate-pulse" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={CalendarDays}
                label="Total Events"
                value={summary.totalEvents}
                color="text-sky-600"
                bg="bg-sky-50"
              />
              <StatCard
                icon={Activity}
                label="Active Events"
                value={summary.activeEvents}
                color="text-emerald-600"
                bg="bg-emerald-50"
              />
              <StatCard
                icon={BookOpen}
                label={user?.role === "USER" ? "My Bookings" : "Total Bookings"}
                value={summary.totalBookings}
                color="text-indigo-600"
                bg="bg-indigo-50"
              />
              <StatCard
                icon={TrendingUp}
                label="Upcoming Bookings"
                value={summary.upcomingBookings}
                color="text-amber-600"
                bg="bg-amber-50"
              />
            </div>

            <SummaryChart
              items={[
                {
                  label: "Total Events",
                  value: summary.totalEvents,
                  color: "bg-sky-500",
                  track: "bg-sky-100",
                },
                {
                  label: "Active Events",
                  value: summary.activeEvents,
                  color: "bg-emerald-500",
                  track: "bg-emerald-100",
                },
                {
                  label:
                    user?.role === "USER" ? "My Bookings" : "Total Bookings",
                  value: summary.totalBookings,
                  color: "bg-indigo-500",
                  track: "bg-indigo-100",
                },
                {
                  label: "Upcoming Bookings",
                  value: summary.upcomingBookings,
                  color: "bg-amber-500",
                  track: "bg-amber-100",
                },
              ]}
            />
          </div>
        )}
      </section>

      {/* Section: Other features */}
      <section className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-indigo-600" />
          <h2 className="text-lg font-bold text-gray-900">Other Features</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group bg-white rounded-2xl border border-gray-100 px-4 py-3 hover:border-indigo-200 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-800">
                  {item.label}
                </span>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Stats — admin only */}
      {user?.role === "ADMIN" && (
        <>
          {loadingStats ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-5 border border-gray-100 h-28 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                icon={Users}
                label="Total Users"
                value={stats?.total ?? 0}
                color="text-indigo-600"
                bg="bg-indigo-50"
              />
              <StatCard
                icon={UserCheck}
                label="Active Users"
                value={stats?.active ?? 0}
                color="text-emerald-600"
                bg="bg-emerald-50"
              />
              <StatCard
                icon={Shield}
                label="Admins"
                value={stats?.admins ?? 0}
                color="text-rose-600"
                bg="bg-rose-50"
              />
              <StatCard
                icon={TrendingUp}
                label="Moderators"
                value={stats?.moderators ?? 0}
                color="text-violet-600"
                bg="bg-violet-50"
              />
            </div>
          )}

          {/* Recent users */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-500" />
                <h2 className="font-bold text-gray-900">Recent Users</h2>
              </div>
              <a
                href="/dashboard/users"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                View all →
              </a>
            </div>
            <div className="divide-y divide-gray-50">
              {recentUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {u.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{u.email}</p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getRoleColor(u.role)}`}
                  >
                    {u.role}
                  </span>
                  <span className="text-xs text-gray-400 hidden md:block">
                    {formatDate(u.createdAt)}
                  </span>
                </div>
              ))}
              {recentUsers.length === 0 && !loadingStats && (
                <p className="text-sm text-gray-400 px-6 py-8 text-center">
                  No users found.
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {/* Non-admin view */}
      {user?.role !== "ADMIN" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UserCheck className="w-8 h-8 text-indigo-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Your Account</h2>
          <p className="text-gray-500 mb-6">
            You are signed in as <strong>{user?.role}</strong>.
          </p>
          <div className="inline-flex flex-col items-start gap-2 bg-gray-50 rounded-2xl px-6 py-4 text-sm text-gray-600">
            <p>
              <span className="font-semibold">Name:</span> {user?.name}
            </p>
            <p>
              <span className="font-semibold">Email:</span> {user?.email}
            </p>
            <p>
              <span className="font-semibold">Role:</span> {user?.role}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
