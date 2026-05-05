"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(ts) {
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 86400000) return "Hari ini";
  if (diff < 172800000) return "Kemarin";
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function SkeletonCard({ isDark }) {
  return (
    <div style={{
      background: isDark ? "#17171a" : "#ffffff",
      border: `1px solid ${isDark ? "#2a2a30" : "#e0e0e8"}`,
      borderRadius: 12,
      padding: 12,
    }}>
      <span style={{
        display: "block", height: 11, borderRadius: 4, width: "55%", marginBottom: 8,
        background: isDark
          ? "linear-gradient(90deg,#2a2a30 0%,#1e1e22 50%,#2a2a30 100%)"
          : "linear-gradient(90deg,#e0e0e8 0%,#f0f0f3 50%,#e0e0e8 100%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.4s infinite linear",
      }} />
      <span style={{
        display: "block", height: 11, borderRadius: 4, width: "85%",
        background: isDark
          ? "linear-gradient(90deg,#2a2a30 0%,#1e1e22 50%,#2a2a30 100%)"
          : "linear-gradient(90deg,#e0e0e8 0%,#f0f0f3 50%,#e0e0e8 100%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.4s infinite linear",
      }} />
    </div>
  );
}

function TypingDot({ isDark }) {
  return (
    <span style={{ display: "inline-flex", gap: 4, alignItems: "center", padding: "4px 0" }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: "50%",
          background: isDark ? "#8b5cf6" : "#6c5ce7",
          animation: "blink 1s infinite",
          animationDelay: `${i * 0.15}s`,
        }} />
      ))}
    </span>
  );
}

export default function ChatApp() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const [chats, setChats] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isDark, setIsDark] = useState(true); // ← theme state
  const [suggestions, setSuggestions] = useState([
    { p: "🤖 AI & Teknologi", s: "Apa dampak Gemini AI terhadap dunia kerja di Indonesia?" },
    { p: "💰 Ekonomi & Investasi", s: "Apa itu Danantara dan bagaimana pengaruhnya ke ekonomi?" },
    { p: "⚽ Timnas Indonesia", s: "Seberapa jauh peluang Timnas Indonesia di kualifikasi Piala Dunia?" },
    { p: "📱 Media Sosial", s: "Mengapa konten hiburan dan kuliner paling viral di Indonesia?" },
  ]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [hoveredChat, setHoveredChat] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const editInputRef = useRef(null);

  // ── Theme tokens ──────────────────────────────────────────────────────────
  const t = isDark ? {
    bg:           "#0f0f11",
    surface:      "#17171a",
    surface2:     "#1e1e22",
    border:       "#2a2a30",
    accent:       "#7c6af7",
    accentSoft:   "rgba(124,106,247,0.1)",
    accentGlow:   "rgba(124,106,247,0.18)",
    accentBorder: "rgba(124,106,247,0.25)",
    text:         "#e8e8f0",
    textMuted:    "#6b6b7d",
    textDim:      "#9595a8",
    userBg:       "#1d1b3a",
    userBorder:   "rgba(124,106,247,0.3)",
    topbarBg:     "rgba(15,15,17,0.85)",
    scrollThumb:  "#2a2a30",
    inputBg:      "#17171a",
    avatarBg:     "#1e1e22",
    badgeBg:      "#1e1e22",
    dropdownBg:   "#17171a",
    toggleIcon:   "☀️",
    toggleTitle:  "Mode Terang",
  } : {
    bg:           "#f4f4f8",
    surface:      "#ffffff",
    surface2:     "#ededf3",
    border:       "#dddde8",
    accent:       "#6c5ce7",
    accentSoft:   "rgba(108,92,231,0.08)",
    accentGlow:   "rgba(108,92,231,0.15)",
    accentBorder: "rgba(108,92,231,0.2)",
    text:         "#1a1a2e",
    textMuted:    "#9090a8",
    textDim:      "#55556e",
    userBg:       "#ede9ff",
    userBorder:   "rgba(108,92,231,0.25)",
    topbarBg:     "rgba(244,244,248,0.9)",
    scrollThumb:  "#dddde8",
    inputBg:      "#ffffff",
    avatarBg:     "#ededf3",
    badgeBg:      "#ededf3",
    dropdownBg:   "#ffffff",
    toggleIcon:   "🌙",
    toggleTitle:  "Mode Gelap",
  };

  // ── Load/save theme preference ────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved) setIsDark(saved === "dark");
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem("theme", isDark ? "dark" : "light"); } catch (_) {}
  }, [isDark, hydrated]);

  // ── Fetch suggestions ─────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchSuggestions() {
      try {
        const cached = localStorage.getItem("suggestions");
        if (cached) { setSuggestions(JSON.parse(cached)); setLoadingSuggestions(false); }
      } catch (_) {}
      setLoadingSuggestions(true);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{
              role: "user",
              content: `Berikan 4 topik pertanyaan yang sedang ramai dibahas di Indonesia sekarang. Format respons HANYA JSON array murni:
[
  {"emoji": "emoji relevan", "kategori": "2-3 kata kategori", "pertanyaan": "pertanyaan menarik bahasa Indonesia, max 10 kata"},
  {"emoji": "...", "kategori": "...", "pertanyaan": "..."},
  {"emoji": "...", "kategori": "...", "pertanyaan": "..."},
  {"emoji": "...", "kategori": "...", "pertanyaan": "..."}
]`,
            }],
          }),
        });
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let full = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          full += decoder.decode(value, { stream: true });
        }
        const match = full.match(/\[[\s\S]*\]/);
        if (match) {
          const items = JSON.parse(match[0]);
          const next = items.slice(0, 4).map((item) => ({ p: `${item.emoji} ${item.kategori}`, s: item.pertanyaan }));
          setSuggestions(next);
          try { localStorage.setItem("suggestions", JSON.stringify(next)); } catch (_) {}
        }
      } catch (_) {
      } finally { setLoadingSuggestions(false); }
    }
    fetchSuggestions();
  }, []);

  const activeChat = chats.find((c) => c.id === activeChatId) || null;

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("chats", JSON.stringify(chats));
  }, [chats, hydrated]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("chats");
      if (saved) setChats(JSON.parse(saved));
    } catch (_) {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages]);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  function createNewChat() {
    const id = generateId();
    setChats((prev) => [{ id, title: "Chat Baru", messages: [], createdAt: Date.now(), updatedAt: Date.now() }, ...prev]);
    setActiveChatId(id);
    setInput("");
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  function deleteChat(id) {
    setChats((prev) => prev.filter((c) => c.id !== id));
    if (activeChatId === id) {
      setActiveChatId(chats.filter((c) => c.id !== id)[0]?.id || null);
    }
  }

  function startRename(chat) { setEditingId(chat.id); setEditingTitle(chat.title); }
  function commitRename(id) {
    if (editingTitle.trim()) setChats((prev) => prev.map((c) => (c.id === id ? { ...c, title: editingTitle.trim() } : c)));
    setEditingId(null);
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || isLoading) return;

    let chatId = activeChatId;
    if (!chatId) {
      chatId = generateId();
      setChats((prev) => [{
        id: chatId,
        title: text.slice(0, 40) + (text.length > 40 ? "…" : ""),
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }, ...prev]);
      setActiveChatId(chatId);
    }

    const userMsg = { id: generateId(), role: "user", content: text, ts: Date.now() };
    const assistantMsgId = generateId();
    const existingMessages = chats.find((c) => c.id === chatId)?.messages || [];
    const historyForAPI = [...existingMessages, userMsg];

    setChats((prev) => prev.map((c) => {
      if (c.id !== chatId) return c;
      return {
        ...c,
        title: c.messages.length === 0 ? text.slice(0, 40) + (text.length > 40 ? "…" : "") : c.title,
        messages: [...c.messages, userMsg, { id: assistantMsgId, role: "assistant", content: "", ts: Date.now() }],
        updatedAt: Date.now(),
      };
    }));

    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historyForAPI.map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!res.ok) {
        let errMsg = `HTTP ${res.status}`;
        try { const e = await res.json(); errMsg = e.error || errMsg; } catch (_) {}
        throw new Error(errMsg);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setChats((prev) => prev.map((c) =>
          c.id !== chatId ? c : {
            ...c,
            messages: c.messages.map((m) =>
              m.id === assistantMsgId ? { ...m, content: accumulated } : m
            ),
            updatedAt: Date.now(),
          }
        ));
      }
    } catch (err) {
      setChats((prev) => prev.map((c) =>
        c.id !== chatId ? c : {
          ...c,
          messages: c.messages.map((m) =>
            m.id === assistantMsgId ? { ...m, content: `⚠️ Error: ${err.message}` } : m
          ),
        }
      ));
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  const groupedChats = chats.reduce((acc, chat) => {
    const label = formatDate(chat.updatedAt);
    if (!acc[label]) acc[label] = [];
    acc[label].push(chat);
    return acc;
  }, {});

  if (status === "loading" || status === "unauthenticated" || !hydrated) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 12,
        background: "#0f0f11", color: "#6b6b7d", fontSize: 14,
      }}>
        <span style={{ fontSize: 36 }}>🤖</span>
        <span style={{ animation: "pulse 1.5s infinite" }}>Sabar ya</span>
      </div>
    );
  }
  async function sendDirect(text) {
  if (!text.trim() || isLoading) return;

  let chatId = generateId();
  setChats((prev) => [{
    id: chatId,
    title: text.slice(0, 40) + (text.length > 40 ? "…" : ""),
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }, ...prev]);
  setActiveChatId(chatId);

  const userMsg = { id: generateId(), role: "user", content: text, ts: Date.now() };
  const assistantMsgId = generateId();

  setChats((prev) => prev.map((c) =>
    c.id !== chatId ? c : {
      ...c,
      messages: [userMsg, { id: assistantMsgId, role: "assistant", content: "", ts: Date.now() }],
      updatedAt: Date.now(),
    }
  ));

  setIsLoading(true);

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: text }] }),
    });

    if (!res.ok) {
      let errMsg = `HTTP ${res.status}`;
      try { const e = await res.json(); errMsg = e.error || errMsg; } catch (_) {}
      throw new Error(errMsg);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let accumulated = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      accumulated += decoder.decode(value, { stream: true });
      setChats((prev) => prev.map((c) =>
        c.id !== chatId ? c : {
          ...c,
          messages: c.messages.map((m) =>
            m.id === assistantMsgId ? { ...m, content: accumulated } : m
          ),
          updatedAt: Date.now(),
        }
      ));
    }
  } catch (err) {
    setChats((prev) => prev.map((c) =>
      c.id !== chatId ? c : {
        ...c,
        messages: c.messages.map((m) =>
          m.id === assistantMsgId ? { ...m, content: `⚠️ Error: ${err.message}` } : m
        ),
      }
    ));
  } finally {
    setIsLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }
}

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body, textarea, input, button { font-family: 'Sora', sans-serif; }

        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes blink {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40%            { opacity: 1; transform: scale(1); }
        }
        @keyframes msgIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes themeFade {
          from { opacity: 0.7; }
          to   { opacity: 1; }
        }

        .msg-in  { animation: msgIn 0.2s ease; }
        .drop-in { animation: dropIn 0.15s ease; }
        .theme-fade { animation: themeFade 0.25s ease; }

        .thin-scroll { scrollbar-width: thin; }
        .thin-scroll::-webkit-scrollbar { width: 4px; }
        .thin-scroll::-webkit-scrollbar-thumb { border-radius: 2px; }

        /* Focus ring for input box */
        .input-box:focus-within {
          border-color: var(--accent-color) !important;
          box-shadow: 0 0 0 3px var(--accent-glow-color) !important;
        }
      `}</style>

      <div
        className="theme-fade"
        style={{
          display: "flex", height: "100vh", overflow: "hidden",
          background: t.bg, color: t.text,
          "--accent-color": t.accent,
          "--accent-glow-color": t.accentGlow,
        }}
        suppressHydrationWarning
      >

        {/* ══ SIDEBAR ══ */}
        <aside style={{
          display: "flex", flexDirection: "column", flexShrink: 0,
          background: t.surface, borderRight: `1px solid ${t.border}`,
          overflow: "hidden",
          width: sidebarOpen ? 260 : 0,
          opacity: sidebarOpen ? 1 : 0,
          transition: "width 250ms ease, opacity 250ms ease",
        }}>

          {/* Sidebar header */}
          <div style={{
            display: "flex", flexDirection: "column",
            padding: "18px 16px 14px", borderBottom: `1px solid ${t.border}`, gap: 12,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>🤖</span>
              <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>
                Groq<span style={{ color: t.accent }}>Chat</span>
              </span>
            </div>
            <button
              onClick={createNewChat}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 12px",
                background: t.accentSoft,
                border: `1px solid ${t.accentBorder}`,
                borderRadius: 12, color: t.accent,
                fontSize: 13, fontWeight: 500, cursor: "pointer",
                transition: "background 0.15s, border-color 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = isDark ? "rgba(124,106,247,0.18)" : "rgba(108,92,231,0.14)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = t.accentSoft; }}
            >
              <span>✏️</span> Chat Baru
            </button>
          </div>

          {/* Chat list */}
          <div
            className="thin-scroll"
            style={{
              flex: 1, overflowY: "auto", padding: "0 10px 16px",
              scrollbarColor: `${t.scrollThumb} transparent`,
            }}
          >
            {chats.length === 0 && (
              <p style={{ textAlign: "center", color: t.textMuted, fontSize: 12, padding: "24px 8px" }}>
                Belum ada riwayat chat
              </p>
            )}
            {Object.entries(groupedChats).map(([label, items]) => (
              <div key={label}>
                <div style={{
                  fontSize: 10.5, fontWeight: 600, color: t.textMuted,
                  textTransform: "uppercase", letterSpacing: "0.8px",
                  padding: "12px 6px 6px",
                }}>
                  {label}
                </div>
                {items.map((chat) => {
                  const isActive = chat.id === activeChatId;
                  const isHovered = hoveredChat === chat.id;
                  return (
                    <div
                      key={chat.id}
                      onClick={() => setActiveChatId(chat.id)}
                      onMouseEnter={() => setHoveredChat(chat.id)}
                      onMouseLeave={() => setHoveredChat(null)}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "8px 10px", borderRadius: 9, cursor: "pointer",
                        transition: "background 0.12s, border-color 0.12s",
                        position: "relative",
                        background: isActive ? t.accentSoft : isHovered ? t.surface2 : "transparent",
                        border: isActive ? `1px solid ${t.accentBorder}` : "1px solid transparent",
                      }}
                    >
                      <span style={{ fontSize: 13, opacity: 0.7, flexShrink: 0 }}>💬</span>

                      {editingId === chat.id ? (
                        <input
                          ref={editInputRef}
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onBlur={() => commitRename(chat.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitRename(chat.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            flex: 1, background: t.surface2,
                            border: `1px solid ${t.accent}`,
                            borderRadius: 5, padding: "2px 6px",
                            fontSize: 12, color: t.text, outline: "none",
                          }}
                        />
                      ) : (
                        <span style={{
                          flex: 1, fontSize: 13, whiteSpace: "nowrap",
                          overflow: "hidden", textOverflow: "ellipsis",
                          color: isActive ? t.text : t.textDim,
                        }}>
                          {chat.title}
                        </span>
                      )}

                      {isHovered && (
                        <div style={{ display: "flex", gap: 2, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                          <button
                            title="Rename"
                            onClick={() => startRename(chat)}
                            style={{
                              width: 24, height: 24, display: "flex",
                              alignItems: "center", justifyContent: "center",
                              borderRadius: 5, fontSize: 12, color: t.textMuted,
                              background: "transparent", border: "none", cursor: "pointer",
                              transition: "color 0.12s, background 0.12s",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.color = t.text; e.currentTarget.style.background = t.border; }}
                            onMouseLeave={e => { e.currentTarget.style.color = t.textMuted; e.currentTarget.style.background = "transparent"; }}
                          >✏️</button>
                          <button
                            title="Hapus"
                            onClick={() => deleteChat(chat.id)}
                            style={{
                              width: 24, height: 24, display: "flex",
                              alignItems: "center", justifyContent: "center",
                              borderRadius: 5, fontSize: 12, color: t.textMuted,
                              background: "transparent", border: "none", cursor: "pointer",
                              transition: "color 0.12s, background 0.12s",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.color = "#f87171"; e.currentTarget.style.background = "rgba(248,113,113,0.1)"; }}
                            onMouseLeave={e => { e.currentTarget.style.color = t.textMuted; e.currentTarget.style.background = "transparent"; }}
                          >🗑️</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </aside>

        {/* ══ MAIN ══ */}
        <main style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", background: t.bg }}>

          {/* Topbar */}
          <div style={{
            height: 52, display: "flex", alignItems: "center", gap: 12,
            padding: "0 18px", borderBottom: `1px solid ${t.border}`,
            flexShrink: 0, background: t.topbarBg, backdropFilter: "blur(10px)",
          }}>
            {/* Toggle sidebar */}
            <button
              onClick={() => setSidebarOpen((s) => !s)}
              title="Toggle sidebar"
              style={{
                width: 32, height: 32, display: "flex",
                alignItems: "center", justifyContent: "center",
                borderRadius: 7, border: `1px solid ${t.border}`,
                color: t.textMuted, fontSize: 14, cursor: "pointer",
                flexShrink: 0, background: "transparent",
                transition: "color 0.12s, border-color 0.12s",
              }}
              onMouseEnter={e => { e.currentTarget.style.color = t.text; e.currentTarget.style.borderColor = t.accent; }}
              onMouseLeave={e => { e.currentTarget.style.color = t.textMuted; e.currentTarget.style.borderColor = t.border; }}
            >
              {sidebarOpen ? "◀" : "▶"}
            </button>

            {/* Chat title */}
            <div style={{
              flex: 1, fontSize: 14, fontWeight: 500,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              color: !activeChat ? t.textMuted : t.textDim,
              fontStyle: !activeChat ? "italic" : "normal",
            }}>
              {activeChat ? activeChat.title : "Pilih atau buat chat baru"}
            </div>

            {/* Model badge */}
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
              color: t.textMuted, background: t.badgeBg,
              border: `1px solid ${t.border}`, borderRadius: 5,
              padding: "2px 8px", whiteSpace: "nowrap", flexShrink: 0,
            }}>
              llama-3.3-70b
            </span>

            {/* ── Theme toggle ── */}
            <button
              onClick={() => setIsDark((d) => !d)}
              title={t.toggleTitle}
              style={{
                width: 32, height: 32, display: "flex",
                alignItems: "center", justifyContent: "center",
                borderRadius: 7, border: `1px solid ${t.border}`,
                background: "transparent", fontSize: 15, cursor: "pointer",
                flexShrink: 0, transition: "border-color 0.15s, background 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = t.accent; e.currentTarget.style.background = t.accentSoft; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.background = "transparent"; }}
            >
              {t.toggleIcon}
            </button>

            {/* User menu */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <button
                onClick={() => setShowUserMenu((v) => !v)}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: t.surface2, border: `1px solid ${t.border}`,
                  borderRadius: 12, paddingLeft: 5, paddingRight: 10, paddingTop: 4, paddingBottom: 4,
                  cursor: "pointer", transition: "border-color 0.12s, background 0.12s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = t.accent; e.currentTarget.style.background = t.accentSoft; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.background = t.surface2; }}
              >
                {session?.user?.image && (
                  <img src={session.user.image} alt={session.user.name} referrerPolicy="no-referrer"
                    style={{ width: 26, height: 26, borderRadius: "50%", border: `1px solid ${t.border}`, objectFit: "cover" }} />
                )}
                <span style={{ fontSize: 13, color: t.textDim, whiteSpace: "nowrap", maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {session?.user?.name?.split(" ")[0]}
                </span>
                <span style={{ fontSize: 10, color: t.textMuted }}>{showUserMenu ? "▴" : "▾"}</span>
              </button>

              {showUserMenu && (
                <>
                  <div style={{ position: "fixed", inset: 0, zIndex: 9 }} onClick={() => setShowUserMenu(false)} />
                  <div className="drop-in" style={{
                    position: "absolute", top: "calc(100% + 8px)", right: 0,
                    width: 240, background: t.dropdownBg,
                    border: `1px solid ${t.border}`, borderRadius: 12,
                    overflow: "hidden", zIndex: 10,
                    boxShadow: isDark ? "0 8px 32px rgba(0,0,0,0.4)" : "0 8px 32px rgba(0,0,0,0.12)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 16 }}>
                      {session?.user?.image && (
                        <img src={session.user.image} alt={session.user.name} referrerPolicy="no-referrer"
                          style={{ width: 40, height: 40, borderRadius: "50%", border: `1px solid ${t.border}`, objectFit: "cover", flexShrink: 0 }} />
                      )}
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{session?.user?.name}</div>
                        <div style={{ fontSize: 11, color: t.textMuted, marginTop: 2, wordBreak: "break-all" }}>{session?.user?.email}</div>
                      </div>
                    </div>
                    <div style={{ height: 1, background: t.border }} />
                    {/* Theme toggle inside dropdown */}
                    <button
                      onClick={() => { setIsDark((d) => !d); setShowUserMenu(false); }}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 10,
                        padding: "12px 16px", background: "transparent", border: "none",
                        fontSize: 13, color: t.textDim, cursor: "pointer", textAlign: "left",
                        transition: "background 0.12s, color 0.12s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = t.accentSoft; e.currentTarget.style.color = t.accent; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = t.textDim; }}
                    >
                      <span>{t.toggleIcon}</span> {t.toggleTitle}
                    </button>
                    <div style={{ height: 1, background: t.border }} />
                    <button
                      onClick={() => { setShowUserMenu(false); signOut({ callbackUrl: "/login" }); }}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 10,
                        padding: "12px 16px", background: "transparent", border: "none",
                        fontSize: 13, color: t.textDim, cursor: "pointer", textAlign: "left",
                        transition: "background 0.12s, color 0.12s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(248,113,113,0.08)"; e.currentTarget.style.color = "#f87171"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = t.textDim; }}
                    >
                      <span>🚪</span> Keluar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Messages ── */}
          <div
            className="thin-scroll"
            style={{
              flex: 1, overflowY: "auto", paddingTop: 24, paddingBottom: 8,
              scrollbarColor: `${t.scrollThumb} transparent`,
            }}
          >
            {!activeChat ? (
              <div style={{
                height: "100%", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                gap: 20, padding: "0 40px", textAlign: "center",
              }}>
                <div style={{
                  width: 56, height: 56, background: t.accentSoft,
                  border: `1px solid ${t.accentBorder}`, borderRadius: 16,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
                }}>🤖</div>
                <div style={{ fontSize: 22, fontWeight: 600, color: t.text, letterSpacing: "-0.02em" }}>
                  Halo! Apa yang bisa dibantu?
                </div>
                <div style={{ fontSize: 14, color: t.textMuted, maxWidth: 280, lineHeight: 1.6 }}>
                  Mulai percakapan baru atau pilih chat dari sidebar.
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, maxWidth: 480, width: "100%" }}>
                  {loadingSuggestions
                    ? [0, 1, 2, 3].map((i) => <SkeletonCard key={i} isDark={isDark} />)
                    : suggestions.map((sg) => (
                        <button
                          key={sg.s}
                          onClick={() => sendDirect(sg.s)}
                          style={{
                            background: t.surface, border: `1px solid ${t.border}`,
                            borderRadius: 12, padding: "12px 14px",
                            cursor: "pointer", textAlign: "left",
                            transition: "border-color 0.12s, background 0.12s",
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = t.accent; e.currentTarget.style.background = t.accentSoft; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.background = t.surface; }}
                        >
                          <p style={{ fontSize: 12, color: t.textDim, margin: 0 }}>{sg.p}</p>
                          <span style={{ fontSize: 11, color: t.textMuted, marginTop: 2, display: "block" }}>{sg.s}</span>
                        </button>
                      ))}
                </div>
              </div>
            ) : activeChat.messages.length === 0 ? (
              <div style={{
                height: "100%", display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                gap: 20, padding: "0 40px", textAlign: "center",
              }}>
                <div style={{
                  width: 56, height: 56, background: t.accentSoft,
                  border: `1px solid ${t.accentBorder}`, borderRadius: 16,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
                }}>✨</div>
                <div style={{ fontSize: 22, fontWeight: 600, color: t.text, letterSpacing: "-0.02em" }}>
                  Chat baru siap!
                </div>
                <div style={{ fontSize: 14, color: t.textMuted, maxWidth: 280, lineHeight: 1.6 }}>
                  Tulis pesan pertamamu di bawah untuk memulai.
                </div>
              </div>
            ) : (
              activeChat.messages.map((msg) => (
                <div key={msg.id} className="msg-in" style={{ maxWidth: 760, margin: "0 auto", padding: "6px 24px" }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 8, flexShrink: 0, marginTop: 2,
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                      background: msg.role === "user" ? t.userBg : t.avatarBg,
                      border: msg.role === "user" ? `1px solid ${t.userBorder}` : `1px solid ${t.border}`,
                    }}>
                      {msg.role === "user" ? "👤" : "🤖"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, fontSize: 11, color: t.textMuted }}>
                        <span style={{ fontWeight: 600, color: t.textDim }}>
                          {msg.role === "user" ? "Kamu" : "Asisten"}
                        </span>
                        <span>{formatTime(msg.ts)}</span>
                      </div>
                      {msg.role === "user" ? (
                        <div style={{
                          display: "inline-block", maxWidth: "100%",
                          background: t.userBg, border: `1px solid ${t.userBorder}`,
                          borderRadius: "4px 12px 12px 12px",
                          padding: "10px 14px", fontSize: 14, lineHeight: 1.7,
                          color: t.text, whiteSpace: "pre-wrap", wordBreak: "break-word",
                        }}>
                          {msg.content}
                        </div>
                      ) : (
                        <div style={{ fontSize: 14, lineHeight: 1.7, color: t.text, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                          {msg.content === "" ? <TypingDot isDark={isDark} /> : msg.content}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ── Input ── */}
          <div style={{
            padding: "16px 24px 20px", borderTop: `1px solid ${t.border}`,
            background: t.bg, flexShrink: 0,
          }}>
            <div
              className="input-box"
              style={{
                maxWidth: 760, margin: "0 auto", display: "flex", gap: 10,
                background: t.inputBg, border: `1px solid ${t.border}`,
                borderRadius: 14, padding: "10px 12px",
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
            >
              <textarea
                ref={inputRef}
                rows={1}
                placeholder="Ketik pesan… (Enter kirim, Shift+Enter baris baru)"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                }}
                style={{
                  flex: 1, background: "transparent", border: "none", outline: "none",
                  color: t.text, fontSize: 14, lineHeight: 1.5,
                  resize: "none", minHeight: 22, maxHeight: 160, padding: "2px 0",
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                title="Kirim"
                style={{
                  width: 36, height: 36, background: t.accent, borderRadius: 9,
                  color: "#fff", fontSize: 15,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  alignSelf: "flex-end", flexShrink: 0, border: "none",
                  opacity: (!input.trim() || isLoading) ? 0.35 : 1,
                  cursor: (!input.trim() || isLoading) ? "not-allowed" : "pointer",
                  transition: "opacity 0.12s, transform 0.12s",
                }}
                onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.transform = "scale(1.05)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
              >
                {isLoading ? "⏳" : "➤"}
              </button>
            </div>
            <div style={{ maxWidth: 760, margin: "8px auto 0", textAlign: "center", fontSize: 11, color: t.textMuted }}>
              Powered by Groq · llama-3.3-70b-versatile · Free tier
            </div>
          </div>
        </main>
      </div>
    </>
  );
}