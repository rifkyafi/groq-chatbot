"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";

function LoginContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [isDark, setIsDark] = useState(true);

  // Sinkron dengan preferensi tema dari ChatApp
  useEffect(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved) setIsDark(saved === "dark");
    } catch (_) {}
  }, []);

  function toggleTheme() {
    setIsDark((d) => {
      const next = !d;
      try { localStorage.setItem("theme", next ? "dark" : "light"); } catch (_) {}
      return next;
    });
  }

  const t = isDark ? {
    pageBg:       "#0f0f11",
    cardBg:       "#17171a",
    border:       "#2a2a30",
    accent:       "#7c6af7",
    accentSoft:   "rgba(124,106,247,0.12)",
    accentBorder: "rgba(124,106,247,0.25)",
    accentText:   "#7c6af7",
    text:         "#e8e8f0",
    textMuted:    "#6b6b7d",
    dividerLine:  "#2a2a30",
    shadow:       "0 0 60px rgba(124,106,247,0.06)",
    toggleIcon:   "☀️",
    toggleTitle:  "Mode Terang",
    toggleBorder: "#2a2a30",
    toggleBg:     "transparent",
  } : {
    pageBg:       "#f4f4f8",
    cardBg:       "#ffffff",
    border:       "#dddde8",
    accent:       "#6c5ce7",
    accentSoft:   "rgba(108,92,231,0.08)",
    accentBorder: "rgba(108,92,231,0.2)",
    accentText:   "#6c5ce7",
    text:         "#1a1a2e",
    textMuted:    "#9090a8",
    dividerLine:  "#dddde8",
    shadow:       "0 0 60px rgba(108,92,231,0.06)",
    toggleIcon:   "🌙",
    toggleTitle:  "Mode Gelap",
    toggleBorder: "#dddde8",
    toggleBg:     "transparent",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; font-family: 'Sora', sans-serif; }

        @keyframes themeFade {
          from { opacity: 0.7; }
          to   { opacity: 1; }
        }
        .theme-fade { animation: themeFade 0.25s ease; }

        .btn-github {
          width: 100%; display: flex; align-items: center;
          justify-content: center; gap: 12px;
          padding: 13px 20px; background: #f0f6fc;
          border: none; border-radius: 12px;
          font-family: 'Sora', sans-serif; font-size: 15px; font-weight: 500;
          color: #0d1117; cursor: pointer;
          transition: opacity 0.15s, transform 0.1s, box-shadow 0.15s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .btn-github:hover { opacity: 0.93; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(0,0,0,0.4); }
        .btn-github:active { transform: translateY(0); }

        .theme-toggle-btn {
          position: absolute;
          top: 20px; right: 20px;
          width: 36px; height: 36px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 9px; font-size: 16px; cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
        }
        .theme-toggle-btn:hover {
          background: rgba(124,106,247,0.1) !important;
          border-color: #7c6af7 !important;
        }
      `}</style>

      {/* Page wrapper */}
      <div
        className="theme-fade"
        style={{
          minHeight: "100vh",
          background: t.pageBg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          position: "relative",
          transition: "background 0.25s ease",
        }}
      >
        {/* Theme toggle — pojok kanan atas */}
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={t.toggleTitle}
          style={{
            border: `1px solid ${t.toggleBorder}`,
            background: t.toggleBg,
          }}
        >
          {t.toggleIcon}
        </button>

        {/* Card */}
        <div style={{
          background: t.cardBg,
          border: `1px solid ${t.border}`,
          borderRadius: 20,
          padding: "48px 40px",
          width: "100%",
          maxWidth: 400,
          textAlign: "center",
          boxShadow: t.shadow,
          transition: "background 0.25s ease, border-color 0.25s ease",
        }}>
          {/* Logo */}
          <div style={{
            width: 64, height: 64,
            background: t.accentSoft,
            border: `1px solid ${t.accentBorder}`,
            borderRadius: 18,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 30, margin: "0 auto 24px",
          }}>
            🤖
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: 24, fontWeight: 600,
            color: t.text, letterSpacing: "-0.5px", marginBottom: 8,
          }}>
            Masuk ke GroqChat
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: 14, color: t.textMuted,
            lineHeight: 1.6, marginBottom: 36,
          }}>
            Login untuk menyimpan riwayat chat kamu<br />dan akses dari mana saja.
          </p>

          {/* GitHub button */}
          <button
            className="btn-github"
            onClick={() => signIn("github", { callbackUrl })}
          >
            <svg style={{ width: 22, height: 22, flexShrink: 0 }} viewBox="0 0 24 24" fill="#0d1117">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            Lanjutkan dengan GitHub
          </button>

          {/* Divider */}
          <div style={{
            margin: "24px 0", display: "flex", alignItems: "center",
            gap: 12, color: t.textMuted, fontSize: 12,
          }}>
            <span style={{ flex: 1, height: 1, background: t.dividerLine }} />
            gratis selamanya
            <span style={{ flex: 1, height: 1, background: t.dividerLine }} />
          </div>

          {/* Note */}
          <p style={{ fontSize: 12, color: t.textMuted, lineHeight: 1.6 }}>
            Tidak perlu kartu kredit.<br />
            Data chat disimpan secara lokal di browser kamu.
          </p>

          {/* Badge */}
          <div style={{
            display: "inline-block", marginTop: 12,
            fontSize: 11, padding: "3px 10px",
            background: t.accentSoft,
            border: `1px solid ${t.accentBorder}`,
            borderRadius: 20, color: t.accentText,
          }}>
            ✓ Free forever · No expiry
          </div>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}