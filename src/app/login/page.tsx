"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    fetch("/api/session")
      .then((r) => r.json())
      .then((data) => {
        if (data.role) {
          const redirect = searchParams.get("redirect") || "/dashboard";
          router.replace(redirect);
        } else {
          setCheckingSession(false);
        }
      })
      .catch(() => setCheckingSession(false));
  }, [router, searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, role: "admin" }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "خطأ في تسجيل الدخول");
        setLoading(false);
        return;
      }

      const redirect = searchParams.get("redirect") || "/dashboard";
      router.replace(redirect);
    } catch {
      setError("حدث خطأ في الاتصال");
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-[var(--primary)] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-[var(--muted-foreground)]">جاري التحقق...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-[var(--background)] p-4"
      dir="rtl"
    >
      <div className="w-full max-w-sm">
        <div className="card">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-[var(--foreground)]">AI-EOS</h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              التنسيق التشغيلي بين المصانع
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label" htmlFor="password">
                كلمة المرور
              </label>
              <input
                id="password"
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="أدخل كلمة المرور"
                autoFocus
                required
              />
            </div>

            {error && (
              <div className="text-sm text-[var(--destructive)] bg-red-50 dark:bg-red-950/50 p-3 rounded-md text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading || !password}
            >
              {loading ? "جاري تسجيل الدخول..." : "دخول"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
