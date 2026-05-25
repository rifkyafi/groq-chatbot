import { useState, useEffect } from "react";

export function useSystemPrompt() {
  const [systemPrompt, setSystemPrompt] = useState(
    "Kamu adalah asisten AI yang ramah dan membantu.",
  );
  const [showSystemModal, setShowSystemModal] = useState(false);
  const [showSystemBadge, setShowSystemBadge] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("systemPrompt");
    if (saved) setSystemPrompt(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("systemPrompt", systemPrompt);
  }, [systemPrompt]);

  const updateSystemPrompt = (v) => {
    setSystemPrompt(v);
    setShowSystemBadge(true);
    setTimeout(() => setShowSystemBadge(false), 3000);
  };

  return {
    systemPrompt,
    showSystemModal,
    setShowSystemModal,
    showSystemBadge,
    updateSystemPrompt,
  };
}
