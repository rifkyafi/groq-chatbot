"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

/**
 * LogoutButton — komponen tombol logout yang bisa dipakai di mana saja.
 *
 * Props:
 * - className  : custom Tailwind class (opsional)
 * - redirectTo : URL tujuan setelah logout (default: "/login")
 * - children   : label tombol (default: ikon ⏏ + teks "Logout")
 */
export default function LogoutButton({
  className = "",
  redirectTo = "/login",
  children,
}) {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    await signOut({ callbackUrl: redirectTo });
    // Tidak perlu setLoading(false) — halaman akan redirect
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      title="Logout"
      className={`flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children ?? (
        <>
          {/* Ikon eject (⏏) */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M5 20h14v-2H5v2zm7-18L5.33 10h13.34L12 2z" />
          </svg>
          {loading ? "Logging out..." : "Logout"}
        </>
      )}
    </button>
  );
}