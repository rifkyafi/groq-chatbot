// src/app/LogoutButton.jsx
"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-sm hover:bg-red-500/20 transition-all"
    >
      🚪 Logout
    </button>
  );
}