"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "الرئيسية" },
  { href: "/daily-input", label: "الإدخال اليومي" },
  { href: "/orders/ctp", label: "حاسبة CTP" },
  { href: "/decisions", label: "القرارات" },
  { href: "/products", label: "المنتجات" },
  { href: "/risks", label: "المخاطر" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-[var(--background)]" dir="rtl">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--card)] sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-6">
              <Link
                href="/dashboard"
                className="text-lg font-bold text-[var(--foreground)]"
              >
                AI-EOS
              </Link>
              {/* Desktop nav */}
              <nav className="hidden md:flex items-center gap-1">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                      pathname === item.href || pathname.startsWith(item.href + "/")
                        ? "bg-[var(--accent)] text-[var(--accent-foreground)] font-medium"
                        : "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/admin/report-editor"
                className="hidden sm:inline-flex btn btn-sm btn-secondary"
              >
                تقرير GM
              </Link>
              <button
                onClick={handleLogout}
                className="btn btn-sm btn-outline"
              >
                خروج
              </button>
              {/* Mobile menu button */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden btn btn-sm btn-secondary"
              >
                {menuOpen ? "✕" : "☰"}
              </button>
            </div>
          </div>
        </div>
        {/* Mobile nav */}
        {menuOpen && (
          <div className="md:hidden border-t border-[var(--border)] bg-[var(--card)]">
            <nav className="px-4 py-2 space-y-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-sm ${
                    pathname === item.href
                      ? "bg-[var(--accent)] text-[var(--accent-foreground)] font-medium"
                      : "text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/admin/report-editor"
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-sm text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
              >
                تقرير GM
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6">{children}</main>
    </div>
  );
}
