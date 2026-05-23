// src/lib/useCopyToClipboard.js
// Fitur 1: Copy pesan ke clipboard
// Cara kerja: navigator.clipboard.writeText() → simpan state "copied" selama 2 detik

import { useState, useCallback } from "react";

export function useCopyToClipboard() {
  const [copiedId, setCopiedId] = useState(null);

  const copy = useCallback((text, id) => {
    // navigator.clipboard hanya tersedia di HTTPS / localhost
    if (!navigator?.clipboard) {
      console.warn("Clipboard API tidak tersedia");
      return;
    }

    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);                          // tandai pesan mana yang di-copy
      setTimeout(() => setCopiedId(null), 2000); // reset setelah 2 detik
    });
  }, []);

  return { copiedId, copy };
}