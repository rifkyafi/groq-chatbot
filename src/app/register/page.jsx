// src/app/register/page.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDark, setIsDark] = useState(true);

  const passwordStrength = {
    length: password.length >= 8,
    hasNumber: /\d/.test(password),
    hasUppercase: /[A-Z]/.test(password),
  };

  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Pendaftaran gagal.");
        return;
      }

      setSuccess("Akun berhasil dibuat! Mengalihkan ke login...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      setError("Terjadi kesalahan. Coba lagi.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  const bgColor = isDark ? "#0f0f11" : "#f5f5f7";
  const textColor = isDark ? "#e8e8f0" : "#1f2937";
  const borderColor = isDark ? "#2a2a30" : "#e5e7eb";
  const inputBg = isDark ? "#17171a" : "#ffffff";

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
          <div className="text-5xl mb-3">✨</div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Buat Akun
          </h1>
          <p
            className="text-sm"
            style={{ color: isDark ? "#6b6b7d" : "#6b7280" }}
          >
            Daftar untuk mulai menggunakan GroqChat
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          {/* Name field */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2">
              Nama Lengkap
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Budi Santoso"
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

          {/* Email field */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="budi@contoh.com"
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
            {/* Password strength indicator */}
            {password && (
              <div className="mt-2 space-y-1.5">
                <div className="text-xs" style={{ color: isDark ? "#6b6b7d" : "#6b7280" }}>
                  Kekuatan password:
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: passwordStrength.length
                          ? "#10b981"
                          : "#6b6b7d",
                      }}
                    />
                    Minimal 8 karakter {passwordStrength.length && "✓"}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: passwordStrength.hasNumber
                          ? "#10b981"
                          : "#6b6b7d",
                      }}
                    />
                    Mengandung angka {passwordStrength.hasNumber && "✓"}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Confirm password field */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2">
              Konfirmasi Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-lg border outline-none transition-all text-sm"
              style={{
                backgroundColor: inputBg,
                borderColor:
                  confirmPassword &&
                  password !== confirmPassword &&
                  "#ef4444"
                    ? "#ef4444"
                    : borderColor,
                color: textColor,
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "#a78bfa")
              }
              onBlur={(e) => (e.currentTarget.style.borderColor = borderColor)}
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-400 mt-1">
                ⚠️ Password tidak cocok
              </p>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-sm">
              ⚠️ {error}
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/25 text-green-400 text-sm">
              ✓ {success}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading || !email || !password || !name || password !== confirmPassword}
            className="w-full py-2.5 rounded-lg bg-violet-500 text-white font-medium transition-all hover:opacity-85 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "⏳ Sedang membuat akun…" : "✏️ Daftar"}
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

        {/* Login link */}
        <p className="text-center text-sm">
          <span style={{ color: isDark ? "#6b6b7d" : "#6b7280" }}>
            Sudah punya akun?{" "}
          </span>
          <Link
            href="/login"
            className="font-semibold text-violet-400 hover:text-violet-300 transition-colors"
          >
            Masuk di sini
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