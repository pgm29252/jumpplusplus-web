import Link from "next/link";
import PublicEventsSection from "@/components/PublicEventsSection";
import LandingNavbar from "@/components/LandingNavbar";
import {
  ArrowRight,
  Zap,
  Shield,
  Users,
  BarChart3,
  CheckCircle2,
  Star,
  Globe,
  Lock,
  Rocket,
} from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Enterprise Security",
    desc: "Role-based access control with JWT authentication and encrypted passwords.",
    color: "text-indigo-500",
    bg: "bg-indigo-50",
  },
  {
    icon: Users,
    title: "User Management",
    desc: "Full CRUD for users with role assignment: Admin, Moderator, or User.",
    color: "text-violet-500",
    bg: "bg-violet-50",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    desc: "Real-time stats and activity overview at a glance.",
    color: "text-sky-500",
    bg: "bg-sky-50",
  },
  {
    icon: Zap,
    title: "Blazing Fast",
    desc: "Next.js 15 frontend and Express API deliver sub-100ms responses.",
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
  {
    icon: Globe,
    title: "REST API",
    desc: "Clean, versioned REST API built with Node.js & Express.",
    color: "text-emerald-500",
    bg: "bg-emerald-50",
  },
  {
    icon: Lock,
    title: "Protected Routes",
    desc: "Middleware-protected pages that redirect unauthenticated users.",
    color: "text-rose-500",
    bg: "bg-rose-50",
  },
];

const testimonials = [
  {
    name: "Sarah Chen",
    role: "CTO at Nexus Labs",
    content:
      "JumpPlusPlus cut our development time in half. The authentication system is rock-solid.",
    stars: 5,
  },
  {
    name: "Marcus Williams",
    role: "Lead Engineer at Flyte",
    content:
      "The cleanest full-stack starter I have used. TypeScript throughout, zero compromises.",
    stars: 5,
  },
  {
    name: "Priya Patel",
    role: "Founder at Stackr",
    content:
      "Deployed to production in a day. The role management saved us weeks of work.",
    stars: 5,
  },
];

const plans = [
  {
    name: "Starter",
    price: "Free",
    desc: "Perfect for side projects",
    features: ["Up to 5 users", "Basic dashboard", "Community support"],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$29",
    desc: "For growing teams",
    features: [
      "Unlimited users",
      "Advanced analytics",
      "Role management",
      "Priority support",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    desc: "For large organisations",
    features: [
      "Custom roles",
      "SSO / SAML",
      "Dedicated support",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <LandingNavbar />

      {/* HERO */}
      <section className="pt-32 pb-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-gradient-to-b from-indigo-50 to-transparent rounded-full blur-3xl opacity-60 pointer-events-none" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-violet-100 rounded-full blur-3xl opacity-40 pointer-events-none" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-sky-100 rounded-full blur-3xl opacity-40 pointer-events-none" />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-sm font-medium px-4 py-2 rounded-full mb-8 border border-indigo-100">
            <Zap className="w-3.5 h-3.5" />
            Next.js 15 · Node.js Express · PostgreSQL
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-none mb-6">
            Build faster.{" "}
            <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 bg-clip-text text-transparent">
              Ship smarter.
            </span>
          </h1>
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
              href="/auth/sign-in"
              className="inline-flex items-center justify-center gap-2 bg-gray-50 text-gray-700 font-semibold text-base px-8 py-4 rounded-2xl hover:bg-gray-100 transition-all border border-gray-200"
            >
              Sign in
            </Link>
          </div>
          <p className="mt-6 text-sm text-gray-400">
            No credit card required · Free forever on Starter plan
          </p>
        </div>

        {/* Dashboard preview */}
        <div className="relative max-w-5xl mx-auto mt-20">
          <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl p-1 shadow-2xl shadow-indigo-200">
            <div className="bg-white rounded-[22px] overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
                <span className="ml-4 text-xs text-gray-400 font-mono">
                  localhost:3000/dashboard
                </span>
              </div>
              <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {
                    label: "Total Users",
                    value: "1,284",
                    color: "text-indigo-600",
                    bg: "bg-indigo-50",
                  },
                  {
                    label: "Active Now",
                    value: "348",
                    color: "text-emerald-600",
                    bg: "bg-emerald-50",
                  },
                  {
                    label: "Admins",
                    value: "12",
                    color: "text-rose-600",
                    bg: "bg-rose-50",
                  },
                  {
                    label: "This Month",
                    value: "+94",
                    color: "text-violet-600",
                    bg: "bg-violet-50",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className={`${stat.bg} rounded-2xl p-4`}
                  >
                    <p className="text-xs text-gray-500 font-medium">
                      {stat.label}
                    </p>
                    <p className={`text-2xl font-bold mt-1 ${stat.color}`}>
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
              <div className="px-6 pb-6">
                <div className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-xs font-semibold text-gray-500 mb-3">
                    RECENT USERS
                  </p>
                  {[
                    "Sarah Chen · Admin",
                    "Marcus W. · User",
                    "Priya P. · Moderator",
                  ].map((u) => (
                    <div
                      key={u}
                      className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0"
                    >
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500" />
                      <span className="text-sm text-gray-700">{u}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <PublicEventsSection />

      {/* FEATURES */}
      <section id="features" className="py-24 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold mb-4">
              Everything you need to{" "}
              <span className="bg-gradient-to-r from-indigo-500 to-violet-600 bg-clip-text text-transparent">
                ship fast
              </span>
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">
              Pre-built features that would normally take weeks, ready in
              minutes.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50 transition-all group"
              >
                <div
                  className={`w-12 h-12 ${f.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <f.icon className={`w-6 h-6 ${f.color}`} />
                </div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold mb-4">
              Trusted by builders worldwide
            </h2>
            <p className="text-lg text-gray-500">
              Thousands of developers ship faster with JumpPlusPlus.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl p-6 border border-indigo-100"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 text-amber-400 fill-amber-400"
                    />
                  ))}
                </div>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  &quot;{t.content}&quot;
                </p>
                <div>
                  <p className="font-semibold text-gray-900">{t.name}</p>
                  <p className="text-sm text-gray-500">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold mb-4">
              Simple, honest pricing
            </h2>
            <p className="text-lg text-gray-500">
              Start free. Upgrade when you need to.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 items-start">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`rounded-2xl p-6 border ${p.highlighted ? "bg-gradient-to-br from-indigo-500 to-violet-600 border-transparent text-white shadow-2xl shadow-indigo-200 scale-105" : "bg-white border-gray-200"}`}
              >
                <p
                  className={`text-sm font-semibold mb-1 ${p.highlighted ? "text-indigo-200" : "text-gray-500"}`}
                >
                  {p.name}
                </p>
                <p
                  className={`text-4xl font-extrabold mb-1 ${p.highlighted ? "text-white" : "text-gray-900"}`}
                >
                  {p.price}
                </p>
                <p
                  className={`text-sm mb-6 ${p.highlighted ? "text-indigo-200" : "text-gray-500"}`}
                >
                  {p.desc}
                </p>
                <ul className="space-y-3 mb-8">
                  {p.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2 text-sm">
                      <CheckCircle2
                        className={`w-4 h-4 flex-shrink-0 ${p.highlighted ? "text-indigo-200" : "text-indigo-500"}`}
                      />
                      <span
                        className={
                          p.highlighted ? "text-indigo-100" : "text-gray-600"
                        }
                      >
                        {feat}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/sign-up"
                  className={`block text-center font-semibold py-3 rounded-xl transition-all ${p.highlighted ? "bg-white text-indigo-600 hover:bg-indigo-50" : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"}`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl px-8 py-16 text-white shadow-2xl shadow-indigo-200">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
              Ready to jump in?
            </h2>
            <p className="text-indigo-200 text-lg mb-8 max-w-xl mx-auto">
              Get up and running in minutes. No setup headaches.
            </p>
            <Link
              href="/auth/sign-up"
              className="inline-flex items-center gap-2 bg-white text-indigo-600 font-bold text-base px-8 py-4 rounded-2xl hover:bg-indigo-50 transition-colors shadow-lg"
            >
              Create your free account <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-100 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Rocket className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-gray-900">JumpPlusPlus</span>
          </div>
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} JumpPlusPlus. Built with Next.js &amp;
            Express.
          </p>
          <div className="flex gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-gray-900 transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-gray-900 transition-colors">
              Terms
            </a>
            <Link
              href="/auth/sign-in"
              className="hover:text-gray-900 transition-colors"
            >
              Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
