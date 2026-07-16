"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "الرئيسية" },
  { href: "/daily-input", label: "الإدخال اليومي" },
  { href: "/orders/ctp", label: "حاسبة CTP" },
  { href: "/decisions", label: "القرارات" },
  { href: "/products", label: "المنتجات" },
  { href: "/risks", label: "المخاطر" },
  { href: "/manage", label: "إدارة" },
];

const EXTRA_LINKS = [
  { href: "/admin/report-editor", label: "تقرير GM" },
  { href: "/data-entry", label: "إدخال بيانات" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  function isActive(href: string) {
    return pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"));
  }

  return (
    <div className="min-h-screen bg-[var(--background)]" dir="rtl">
      <header className="border-b border-[var(--border)] bg-[var(--card)] sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="text-lg font-bold text-[var(--foreground)]">AI-EOS</Link>
              <nav className="hidden md:flex items-center gap-1">
                {NAV_ITEMS.map(item => (
                  <Link key={item.href} href={item.href}
                    className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                      isActive(item.href)
                        ? "bg-[var(--accent)] text-[var(--accent-foreground)] font-medium"
                        : "text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]"
                    }`}>
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-2">
              {EXTRA_LINKS.map(link => (
                <Link key={link.href} href={link.href} className="hidden sm:inline-flex btn btn-sm btn-secondary">
                  {link.label}
                </Link>
              ))}
              <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden btn btn-sm btn-secondary">
                {menuOpen ? "✕" : "☰"}
              </button>
            </div>
          </div>
        </div>
        {menuOpen && (
          <div className="md:hidden border-t border-[var(--border)] bg-[var(--card)]">
            <nav className="px-4 py-2 space-y-1">
              {[...NAV_ITEMS, ...EXTRA_LINKS].map(item => (
                <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-sm ${
                    isActive(item.href)
                      ? "bg-[var(--accent)] text-[var(--accent-foreground)] font-medium"
                      : "text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
                  }`}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6">{children}</main>
    </div>
  );
}
