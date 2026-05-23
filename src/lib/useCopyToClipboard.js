// src/lib/useCopyToClipboard.js
"use client";

import { useState, useCallback } from "react";

export function useCopyToClipboard() {
  const [copiedId, setCopiedId] = useState(null);

  const copy = useCallback(async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  }, []);

  return { copiedId, copy };
}