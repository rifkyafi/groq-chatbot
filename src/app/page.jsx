"use client";

import { SessionProvider } from "next-auth/react";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const ChatApp = dynamic(() => import("./ChatApp"), { ssr: false });

export default function Page() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <SessionProvider>
      <ChatApp />
    </SessionProvider>
  );
}