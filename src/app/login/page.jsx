// src/app/login/page.jsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDark, setIsDark] = useState(true);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.ok) {
        router.push(callbackUrl);
      } else {
        setError(result?.error || "Email atau password salah.");
      }
    } catch (err) {
      setError("Terjadi kesalahan. Coba lagi.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  const bgColor = isDark ? "#000000": "#ffffff"
  const textColor = isDark ? "#e8e8ef" : "#1f2937";
  const borderColor = isDark ? "#2a2a30" : "#e5e7eb";
  const inputBg = isDark ? "#000000":"#ffffff";

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-300"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600&display=swap');
        * { font-family: 'Sora', sans-serif; }
      `}</style>

      {/* Theme toggle */}
      <button
        onClick={() => setIsDark(!isDark)}
        className="absolute top-6 right-6 w-10 h-10 rounded-full border flex items-center justify-center text-lg transition-all hover:scale-110"
        style={{ borderColor, backgroundColor: inputBg }}
        title="Toggle theme"
      >
        {isDark ? "☀️" : "🌙"}
      </button>

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🤖</div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Groq<span style={{ color: "#a78bfa" }}>Chat</span>
          </h1>
          <p
            className="text-sm"
            style={{ color: isDark ? "#6b6b7d" : "#6b7280" }}
          >
            Chatbot AI ultra-cepat dengan Groq
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email field */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@contoh.com"
              className="w-full px-4 py-2.5 rounded-lg border outline-none transition-all text-sm"
              style={{
                backgroundColor: inputBg,
                borderColor,
                color: textColor,
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "#a78bfa")
              }
              onBlur={(e) => (e.currentTarget.style.borderColor = borderColor)}
            />
          </div>

          {/* Password field */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-lg border outline-none transition-all text-sm"
              style={{
                backgroundColor: inputBg,
                borderColor,
                color: textColor,
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "#a78bfa")
              }
              onBlur={(e) => (e.currentTarget.style.borderColor = borderColor)}
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-sm">
              ⚠️ {error}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-lg bg-violet-500 text-white font-medium transition-all hover:opacity-85 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "⏳ Sedang masuk…" : "🔓 Masuk"}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div
            className="flex-1 h-px"
            style={{ backgroundColor: borderColor }}
          />
          <span style={{ color: isDark ? "#6b6b7d" : "#9ca3af" }}>atau</span>
          <div
            className="flex-1 h-px"
            style={{ backgroundColor: borderColor }}
          />
        </div>

        {/* Register link */}
        <p className="text-center text-sm">
          <span style={{ color: isDark ? "#6b6b7d" : "#6b7280" }}>
            Belum punya akun?{" "}
          </span>
          <Link
            href="/register"
            className="font-semibold text-violet-400 hover:text-violet-300 transition-colors"
          >
            Daftar di sini
          </Link>
        </p>

        {/* Footer */}
        <div
          className="mt-8 text-center text-xs"
          style={{ color: isDark ? "#6b6b7d" : "#9ca3af" }}
        >
          Powered by Groq · llama-3.3-70b-versatile
        </div>
      </div>
    </div>
  );
}