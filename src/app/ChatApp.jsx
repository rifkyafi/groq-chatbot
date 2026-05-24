"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

// ── Fitur baru ──
import { useCopyToClipboard } from "@/lib/useCopyToClipboard";
import { useExportChat } from "@/lib/useExportChat";
import SystemPromptModal from "./SystemPromptModal";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function generateId() {
  return Math.random().toString(36).substring(2, 10);
}
function formatTime(ts) {
  return new Date(ts).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
function formatDate(ts) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = now - d;
  if (diff === 0) return "Hari ini";
  if (diff <= 86400000) return "Kemarin";
  if (diff <= 7 * 86400000) return "Minggu ini";
  return new Date(ts).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-[rgba(255,255,255,0.04)] border border-[rgba(123,229,255,0.12)] rounded-3xl p-3">
      <span className="block h-[11px] rounded w-[55%] mb-2 bg-gradient-to-r from-[rgba(123,229,255,0.08)] via-[rgba(123,229,255,0.14)] to-[rgba(123,229,255,0.08)] bg-[length:200%_100%] animate-shimmer" />
      <span className="block h-[11px] rounded w-[85%] bg-gradient-to-r from-[rgba(123,229,255,0.08)] via-[rgba(123,229,255,0.14)] to-[rgba(123,229,255,0.08)] bg-[length:200%_100%] animate-shimmer" />
    </div>
  );
}

function TypingDot() {
  return (
    <span className="inline-flex gap-1 items-center py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-blink"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}

// ─── Export dropdown ──────────────────────────────────────────────────────────
function ExportMenu({ onExport }) {
  const [open, setOpen] = useState(false);

  const formats = [
    { id: "markdown", label: "📝 Markdown (.md)", desc: "Notion, Obsidian" },
    { id: "txt", label: "📄 Plain Text (.txt)", desc: "Paling universal" },
    { id: "json", label: "🗂️ JSON (.json)", desc: "Backup / developer" },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Export chat"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl text-[11px] text-[var(--text-dim)] border border-[rgba(123,229,255,0.12)] bg-[rgba(255,255,255,0.04)] hover:border-[rgba(123,229,255,0.2)] hover:text-[var(--text)] transition-all"
      >
        ⬇️ Export
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[9]" onClick={() => setOpen(false)} />
          <div className="absolute top-[calc(100%+6px)] right-0 w-52 bg-[rgba(14,21,36,0.96)] border border-[rgba(123,229,255,0.12)] rounded-3xl z-10 overflow-hidden shadow-[0_24px_40px_rgba(0,0,0,0.24)] animate-dropIn">
            <p className="text-[9px] font-semibold text-[var(--text-dim)] uppercase tracking-widest px-3 pt-3 pb-1">
              Pilih format
            </p>
            {formats.map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  onExport(f.id);
                  setOpen(false);
                }}
                className="w-full flex flex-col px-3 py-2 text-left hover:bg-[#1e1e22] transition-colors border-none bg-transparent cursor-pointer"
              >
                <span className="text-[12px] text-[#e8e8f0]">{f.label}</span>
                <span className="text-[10px] text-[#6b6b7d]">{f.desc}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ChatApp() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // ── State utama ──
  const [chats, setChats] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [hoveredChat, setHoveredChat] = useState(null);

  // ── State fitur baru ──
  const [systemPrompt, setSystemPrompt] = useState(
    "Kamu adalah asisten AI yang ramah dan membantu.",
  );
  const [showSystemModal, setShowSystemModal] = useState(false);
  const [showSystemBadge, setShowSystemBadge] = useState(false);

  const [suggestions, setSuggestions] = useState([
    {
      p: "🤖 AI & Teknologi",
      s: "Apa dampak Gemini AI terhadap dunia kerja di Indonesia?",
    },
    {
      p: "💰 Ekonomi & Investasi",
      s: "Apa itu Danantara dan bagaimana pengaruhnya ke ekonomi?",
    },
    {
      p: "⚽ Timnas Indonesia",
      s: "Seberapa jauh peluang Timnas Indonesia di kualifikasi Piala Dunia?",
    },
    {
      p: "📱 Media Sosial",
      s: "Mengapa konten hiburan dan kuliner paling viral di Indonesia?",
    },
  ]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);

  // ── Custom hooks ──
  const { copiedId, copy } = useCopyToClipboard();
  const { exportChat } = useExportChat();

  // ── Refs ──
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const editInputRef = useRef(null);

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null;

  // ── Persist ke localStorage per-user (namespace by email) ──
  const storageKey = session?.user?.email
    ? `chats:${session.user.email}`
    : null;

  useEffect(() => {
    if (!hydrated || !storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(chats));
    } catch (_) {}
  }, [chats, hydrated, storageKey]);

  useEffect(() => {
    // Load chats for the current logged-in user only. Do NOT fall back to global key to avoid cross-account leakage.
    try {
      if (storageKey) {
        const saved = localStorage.getItem(storageKey);
        if (saved) setChats(JSON.parse(saved));
        else setChats([]);
      }
    } catch (_) {}
    setHydrated(true);
  }, [storageKey]);

  // Persist system prompt terpisah
  useEffect(() => {
    localStorage.setItem("systemPrompt", systemPrompt);
  }, [systemPrompt]);
  useEffect(() => {
    const saved = localStorage.getItem("systemPrompt");
    if (saved) setSystemPrompt(saved);
  }, []);

  // ── Scroll ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages]);

  // ── Rename focus ──
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  // ── Suggestions ──
  useEffect(() => {
    async function fetchSuggestions() {
      try {
        const cached = localStorage.getItem("suggestions");
        if (cached) {
          setSuggestions(JSON.parse(cached));
          setLoadingSuggestions(false);
        }
      } catch (_) {}
      setLoadingSuggestions(true);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              {
                role: "user",
                content: `Berikan 4 topik pertanyaan yang sedang ramai dibahas di Indonesia sekarang. Format respons HANYA JSON array murni:
[
  {"emoji": "emoji relevan", "kategori": "2-3 kata kategori", "pertanyaan": "pertanyaan menarik bahasa Indonesia, max 10 kata"},
  {"emoji": "...", "kategori": "...", "pertanyaan": "..."},
  {"emoji": "...", "kategori": "...", "pertanyaan": "..."},
  {"emoji": "...", "kategori": "...", "pertanyaan": "..."}
]`,
              },
            ],
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
          const next = items.slice(0, 4).map((item) => ({
            p: `${item.emoji} ${item.kategori}`,
            s: item.pertanyaan,
          }));
          setSuggestions(next);
          try {
            localStorage.setItem("suggestions", JSON.stringify(next));
          } catch (_) {}
        }
      } catch (_) {
      } finally {
        setLoadingSuggestions(false);
      }
    }
    fetchSuggestions();
  }, []);

  // ── Chat CRUD ──
  function createNewChat() {
    const id = generateId();
    setChats((prev) => [
      {
        id,
        title: "Chat Baru",
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      ...prev,
    ]);
    setActiveChatId(id);
    setInput("");
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  function deleteChat(id) {
    setChats((prev) => prev.filter((c) => c.id !== id));
    if (activeChatId === id)
      setActiveChatId(chats.filter((c) => c.id !== id)[0]?.id ?? null);
  }

  function startRename(chat) {
    setEditingId(chat.id);
    setEditingTitle(chat.title);
  }
  function commitRename(id) {
    if (editingTitle.trim())
      setChats((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, title: editingTitle.trim() } : c,
        ),
      );
    setEditingId(null);
  }

  // ── FIX: Klik suggestion → buat chat baru + langsung kirim ───────────────
  // Tidak bergantung state `input` sehingga tidak ada race condition
  function startChatWithSuggestion(text) {
    if (isLoading) return;

    const chatId = generateId();
    const userMsgId = generateId();
    const assistantMsgId = generateId();

    const userMsg = {
      id: userMsgId,
      role: "user",
      content: text,
      ts: Date.now(),
    };

    // Buat chat baru + user message + placeholder AI dalam satu setState
    setChats((prev) => [
      {
        id: chatId,
        title: text.slice(0, 40) + (text.length > 40 ? "…" : ""),
        messages: [
          userMsg,
          {
            id: assistantMsgId,
            role: "assistant",
            content: "",
            ts: Date.now(),
          },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      ...prev,
    ]);

    setActiveChatId(chatId);
    setInput("");
    setIsLoading(true);

    // Kirim ke API langsung pakai `text`, bukan state
    (async () => {
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: text },
            ],
          }),
        });

        if (!res.ok) {
          let errMsg = `HTTP ${res.status}`;
          try {
            const e = await res.json();
            errMsg = e.error ?? errMsg;
          } catch (_) {}
          throw new Error(errMsg);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });

          setChats((prev) =>
            prev.map((c) =>
              c.id !== chatId
                ? c
                : {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.id !== assistantMsgId
                        ? m
                        : { ...m, content: accumulated },
                    ),
                    updatedAt: Date.now(),
                  },
            ),
          );
        }
      } catch (err) {
        setChats((prev) =>
          prev.map((c) =>
            c.id !== chatId
              ? c
              : {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id !== assistantMsgId
                      ? m
                      : { ...m, content: `⚠️ Error: ${err.message}` },
                  ),
                },
          ),
        );
      } finally {
        setIsLoading(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    })();
  }

  // ── Core: send message ────────────────────────────────────────────────────
  async function sendMessage(overrideMessages = null) {
    const text = input.trim();
    if (!overrideMessages && (!text || isLoading)) return;

    let chatId = activeChatId;
    if (!chatId) {
      chatId = generateId();
      setChats((prev) => [
        {
          id: chatId,
          title: text.slice(0, 40) + (text.length > 40 ? "…" : ""),
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        ...prev,
      ]);
      setActiveChatId(chatId);
    }

    const assistantMsgId = generateId();

    let historyForAPI;

    if (overrideMessages) {
      historyForAPI = overrideMessages;
      setChats((prev) =>
        prev.map((c) => {
          if (c.id !== chatId) return c;
          return {
            ...c,
            messages: [
              ...c.messages,
              {
                id: assistantMsgId,
                role: "assistant",
                content: "",
                ts: Date.now(),
              },
            ],
            updatedAt: Date.now(),
          };
        }),
      );
    } else {
      const userMsg = {
        id: generateId(),
        role: "user",
        content: text,
        ts: Date.now(),
      };
      const existingMessages =
        chats.find((c) => c.id === chatId)?.messages ?? [];
      historyForAPI = [...existingMessages, userMsg];

      setChats((prev) =>
        prev.map((c) => {
          if (c.id !== chatId) return c;
          return {
            ...c,
            title:
              c.messages.length === 0
                ? text.slice(0, 40) + (text.length > 40 ? "…" : "")
                : c.title,
            messages: [
              ...c.messages,
              userMsg,
              {
                id: assistantMsgId,
                role: "assistant",
                content: "",
                ts: Date.now(),
              },
            ],
            updatedAt: Date.now(),
          };
        }),
      );
      setInput("");
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            ...historyForAPI.map(({ role, content }) => ({ role, content })),
          ],
        }),
      });

      if (!res.ok) {
        let errMsg = `HTTP ${res.status}`;
        try {
          const e = await res.json();
          errMsg = e.error ?? errMsg;
        } catch (_) {}
        throw new Error(errMsg);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setChats((prev) =>
          prev.map((c) =>
            c.id !== chatId
              ? c
              : {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id !== assistantMsgId
                      ? m
                      : { ...m, content: accumulated },
                  ),
                  updatedAt: Date.now(),
                },
          ),
        );
      }
    } catch (err) {
      setChats((prev) =>
        prev.map((c) =>
          c.id !== chatId
            ? c
            : {
                ...c,
                messages: c.messages.map((m) =>
                  m.id !== assistantMsgId
                    ? m
                    : { ...m, content: `⚠️ Error: ${err.message}` },
                ),
              },
        ),
      );
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  // ── Regenerate ──────────────────────────────────────────────────
  function regenerateLast() {
    if (!activeChat || isLoading) return;

    const msgs = activeChat.messages;
    let lastAiIdx = -1;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === "assistant") {
        lastAiIdx = i;
        break;
      }
    }
    if (lastAiIdx === -1) return;

    const messagesWithoutLastAI = msgs.slice(0, lastAiIdx);

    setChats((prev) =>
      prev.map((c) =>
        c.id !== activeChatId ? c : { ...c, messages: messagesWithoutLastAI },
      ),
    );

    sendMessage(messagesWithoutLastAI);
  }

  // ── Grouped sidebar ──
  const groupedChats = chats.reduce((acc, chat) => {
    const label = formatDate(chat.updatedAt);
    if (!acc[label]) acc[label] = [];
    acc[label].push(chat);
    return acc;
  }, {});

  // ── Guard ──
  if (status === "loading" || status === "unauthenticated" || !hydrated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#0f0f11] text-[#6b6b7d] text-sm">
        <span className="text-4xl">🤖</span>
        <span className="animate-pulse">Memuat sesi…</span>
      </div>
    );
  }

  const isLastMsgAI =
    activeChat?.messages?.length > 0 &&
    activeChat.messages[activeChat.messages.length - 1].role === "assistant" &&
    activeChat.messages[activeChat.messages.length - 1].content !== "";

  return (
    <>
      {/* ── System Prompt Modal ── */}
      <SystemPromptModal
        isOpen={showSystemModal}
        onClose={() => setShowSystemModal(false)}
        value={systemPrompt}
        onChange={(v) => {
          setSystemPrompt(v);
          setShowSystemBadge(true);
          setTimeout(() => setShowSystemBadge(false), 3000);
        }}
      />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body, textarea, input, button, select { font-family: 'Montserrat', sans-serif; }

        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes blink {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40%           { opacity: 1;   transform: scale(1); }
        }
        @keyframes msgIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        .animate-shimmer  { animation: shimmer 1.4s infinite linear; }
        .animate-blink    { animation: blink 1s infinite; }
        .animate-msg-in   { animation: msgIn 0.2s ease; }
        .animate-dropIn   { animation: dropIn 0.15s ease; }

        .thin-scroll { scrollbar-width: thin; scrollbar-color: rgba(123,229,255,0.14) transparent; }
        .thin-scroll::-webkit-scrollbar { width: 4px; }
        .thin-scroll::-webkit-scrollbar-thumb { background: rgba(123,229,255,0.14); border-radius: 2px; }
      `}</style>

      <div
        className="flex h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(123,229,255,0.08),_transparent_25%),var(--bg)] text-[var(--text)]"
        suppressHydrationWarning
      >
        {/* ══════════ SIDEBAR ══════════ */}
        <aside
          className="flex flex-col flex-shrink-0 bg-[var(--surface)] border-r border-[rgba(123,229,255,0.14)] overflow-hidden transition-all duration-200"
          style={{ width: sidebarOpen ? 260 : 0, opacity: sidebarOpen ? 1 : 0 }}
        >
          {/* Header sidebar */}
          <div className="flex flex-col px-4 pt-[18px] pb-[14px] border-b border-[rgba(123,229,255,0.12)] gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🤖</span>
              <span className="text-[15px] font-semibold tracking-tight whitespace-nowrap">
                Groq<span className="text-[var(--accent)]">Chat</span>
              </span>
            </div>

            <button
              onClick={createNewChat}
              className="flex items-center gap-2 px-3 py-2 bg-[rgba(123,229,255,0.08)] border border-[rgba(123,229,255,0.14)] rounded-2xl text-[var(--accent)] text-[13px] font-medium cursor-pointer transition-all hover:bg-[rgba(123,229,255,0.14)] hover:border-[rgba(123,229,255,0.22)]"
            >
              <span className="text-[14px]">✦</span> Chat Baru
            </button>

            <button
              onClick={() => setShowSystemModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-[rgba(255,255,255,0.04)] border border-[rgba(123,229,255,0.12)] rounded-2xl text-[var(--text-dim)] text-[12px] cursor-pointer transition-all hover:border-[rgba(123,229,255,0.22)] hover:text-[var(--text)]"
              title="Atur kepribadian asisten"
            >
              <span className="text-[14px]">⚙</span>
              <span className="flex-1 text-left truncate">System Prompt</span>
              {systemPrompt !==
                "Kamu adalah asisten AI yang ramah dan membantu." && (
                <span className="w-2 h-2 rounded-full bg-[var(--accent)] flex-shrink-0" />
              )}
            </button>
          </div>

          {/* Chat list */}
          <div className="flex-1 overflow-y-auto px-2.5 pb-4 thin-scroll">
            {chats.length === 0 && (
              <p className="text-center text-[#6b6b7d] text-xs py-6 px-2">
                Belum ada riwayat chat
              </p>
            )}

            {Object.entries(groupedChats).map(([label, items]) => (
              <div key={label}>
                <div className="text-[10.5px] font-semibold text-[var(--text-dim)] uppercase tracking-[0.8px] px-1.5 pt-3 pb-1.5">
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
                      className="flex items-center gap-1.5 px-3 py-2 rounded-2xl cursor-pointer transition-all relative"
                      style={{
                        background: isActive
                          ? "rgba(123,229,255,0.12)"
                          : isHovered
                            ? "rgba(123,229,255,0.06)"
                            : "transparent",
                        border: isActive
                          ? "1px solid rgba(123,229,255,0.18)"
                          : "1px solid transparent",
                      }}
                    >
                      <span className="text-[13px] opacity-70 flex-shrink-0">
                        💬
                      </span>

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
                          className="flex-1 bg-[rgba(255,255,255,0.05)] border border-[rgba(123,229,255,0.14)] rounded px-1.5 py-0.5 text-xs text-[var(--text)] outline-none"
                        />
                      ) : (
                        <span
                          className="flex-1 text-[13px] whitespace-nowrap overflow-hidden text-ellipsis"
                          style={{
                            color: isActive ? "var(--text)" : "var(--text-dim)",
                          }}
                        >
                          {chat.title}
                        </span>
                      )}

                      {isHovered && (
                        <div
                          className="flex items-center gap-0.5 flex-shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            title="Rename"
                            onClick={() => startRename(chat)}
                            className="w-6 h-6 flex items-center justify-center rounded text-xs text-[var(--text-dim)] bg-transparent border-none cursor-pointer transition-all hover:text-[var(--text)] hover:bg-[rgba(255,255,255,0.06)]"
                          >
                            ✏️
                          </button>
                          <button
                            title="Hapus"
                            onClick={() => deleteChat(chat.id)}
                            className="w-6 h-6 flex items-center justify-center rounded text-xs text-[var(--text-dim)] bg-transparent border-none cursor-pointer transition-all hover:text-[var(--danger)] hover:bg-[rgba(251,113,133,0.1)]"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </aside>

        {/* ══════════ MAIN ══════════ */}
        <main className="flex flex-col flex-1 overflow-hidden bg-[rgba(6,8,18,0.88)]">
          {/* Topbar */}
          <div className="h-[52px] flex items-center gap-3 px-[18px] border-b border-[rgba(123,229,255,0.1)] flex-shrink-0 bg-[rgba(6,8,18,0.76)] backdrop-blur-md">
            <button
              onClick={() => setSidebarOpen((s) => !s)}
              title="Toggle sidebar"
              className="w-8 h-8 flex items-center justify-center rounded-2xl border border-[rgba(123,229,255,0.14)] text-[var(--text-dim)] text-sm cursor-pointer flex-shrink-0 bg-[rgba(255,255,255,0.04)] transition-all hover:text-[var(--text)] hover:border-[rgba(123,229,255,0.24)]"
            >
              {sidebarOpen ? "◀" : "▶"}
            </button>

            <div
              className="flex-1 text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis"
              style={{
                color: !activeChat ? "var(--text-dim)" : "var(--text)",
                fontStyle: !activeChat ? "italic" : "normal",
              }}
            >
              {activeChat ? activeChat.title : "Pilih atau buat chat baru"}
            </div>

            {showSystemBadge && (
              <span
                className="text-[10px] font-mono text-[var(--accent)] bg-[rgba(123,229,255,0.08)] border border-[rgba(123,229,255,0.12)] rounded-full px-2.5 py-0.5 whitespace-nowrap"
                style={{ animation: "slideIn 0.2s ease" }}
              >
                ✓ System prompt tersimpan
              </span>
            )}

            {activeChat && activeChat.messages.length > 0 && (
              <ExportMenu
                onExport={(format) => exportChat(activeChat, format)}
              />
            )}

            <span className="font-mono text-[10px] text-[var(--text-dim)] bg-[rgba(255,255,255,0.04)] border border-[rgba(123,229,255,0.12)] rounded-full px-2 py-0.5 whitespace-nowrap flex-shrink-0">
              llama-3.3-70b
            </span>

            {/* User menu */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowUserMenu((v) => !v)}
                className="flex items-center gap-2 bg-[rgba(255,255,255,0.05)] border border-[rgba(123,229,255,0.12)] rounded-2xl pl-[5px] pr-2.5 py-1 cursor-pointer transition-all hover:border-[rgba(123,229,255,0.24)] hover:bg-[rgba(123,229,255,0.08)]"
              >
                {session?.user?.image && (
                  <img
                    src={session.user.image}
                    alt={session.user.name}
                    referrerPolicy="no-referrer"
                    className="w-[26px] h-[26px] rounded-full border border-[rgba(123,229,255,0.14)] object-cover"
                  />
                )}
                <span className="text-[13px] text-[var(--text-dim)] whitespace-nowrap max-w-[80px] overflow-hidden text-ellipsis">
                  {session?.user?.name?.split(" ")[0]}
                </span>
                <span className="text-[10px] text-[var(--text-dim)]">
                  {showUserMenu ? "▴" : "▾"}
                </span>
              </button>

              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-[9]"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="animate-dropIn absolute top-[calc(100%+8px)] right-0 w-60 bg-[rgba(14,21,36,0.96)] border border-[rgba(123,229,255,0.12)] rounded-3xl overflow-hidden z-10 shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
                    <div className="flex items-center gap-3 p-4">
                      {session?.user?.image && (
                        <img
                          src={session.user.image}
                          alt={session.user.name}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-full border border-[rgba(123,229,255,0.14)] object-cover flex-shrink-0"
                        />
                      )}
                      <div>
                        <div className="text-[13px] font-semibold text-[var(--text)]">
                          {session?.user?.name}
                        </div>
                        <div className="text-[11px] text-[var(--text-dim)] mt-0.5 break-all">
                          {session?.user?.email}
                        </div>
                      </div>
                    </div>
                    <div className="h-px bg-[rgba(123,229,255,0.1)]" />
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        signOut({ callbackUrl: "/login" });
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-3 bg-transparent border-none text-[13px] text-[var(--text-dim)] cursor-pointer text-left transition-all hover:bg-[rgba(251,113,133,0.1)] hover:text-[var(--danger)]"
                    >
                      <span>🚪</span> Keluar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ══ Messages ══ */}
          <div className="flex-1 overflow-y-auto pt-6 pb-2 thin-scroll">
            {!activeChat ? (
              <div className="h-full flex flex-col items-center justify-center gap-5 px-10 text-center">
                <div className="w-14 h-14 bg-[rgba(123,229,255,0.08)] border border-[rgba(123,229,255,0.14)] rounded-3xl flex items-center justify-center text-[26px] text-[var(--accent)]">
                  🤖
                </div>
                <div className="text-[22px] font-semibold text-[var(--text)] tracking-tight">
                  Halo! Apa yang bisa dibantu?
                </div>
                <div className="text-sm text-[var(--text-dim)] max-w-[280px] leading-relaxed">
                  Mulai percakapan baru atau pilih chat dari sidebar.
                </div>
                <div className="grid grid-cols-2 gap-2.5 max-w-[480px] w-full">
                  {loadingSuggestions
                    ? [0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)
                    : suggestions.map((sg) => (
                        <button
                          key={sg.s}
                          onClick={() => startChatWithSuggestion(sg.s)}
                          disabled={isLoading}
                          className="bg-[rgba(255,255,255,0.04)] border border-[rgba(123,229,255,0.12)] rounded-3xl p-3 cursor-pointer text-left transition-all hover:border-[rgba(123,229,255,0.2)] hover:bg-[rgba(123,229,255,0.1)] disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <p className="text-xs text-[var(--text-dim)] m-0">
                            {sg.p}
                          </p>
                          <span className="text-[11px] text-[var(--text)] mt-0.5 block">
                            {sg.s}
                          </span>
                        </button>
                      ))}
                </div>
              </div>
            ) : activeChat.messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-5 px-10 text-center">
                <div className="w-14 h-14 bg-[rgba(123,229,255,0.08)] border border-[rgba(123,229,255,0.14)] rounded-3xl flex items-center justify-center text-[26px] text-[var(--accent)]">
                  ✨
                </div>
                <div className="text-[22px] font-semibold text-[var(--text)] tracking-tight">
                  Chat baru siap!
                </div>
                <div className="text-sm text-[var(--text-dim)] max-w-[280px] leading-relaxed">
                  Tulis pesan pertamamu di bawah untuk memulai.
                </div>
              </div>
            ) : (
              <>
                {activeChat.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className="animate-msg-in max-w-[760px] mx-auto px-6 py-1.5 group"
                  >
                    <div className="flex gap-3 items-start">
                      {/* Avatar */}
                      <div
                        className="w-[30px] h-[30px] rounded-lg flex items-center justify-center text-sm flex-shrink-0 mt-0.5"
                        style={{
                          background:
                            msg.role === "user" ? "#1d1b3a" : "#1e1e22",
                          border:
                            msg.role === "user"
                              ? "1px solid rgba(124,106,247,0.3)"
                              : "1px solid #2a2a30",
                        }}
                      >
                        {msg.role === "user" ? "👤" : "🤖"}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Meta */}
                        <div className="flex items-center gap-2 mb-1.5 text-[11px] text-[var(--text-dim)]">
                          <span className="font-semibold text-[var(--text)]">
                            {msg.role === "user" ? "Kamu" : "Asisten"}
                          </span>
                          <span>{formatTime(msg.ts)}</span>

                          {msg.content && (
                            <button
                              onClick={() => copy(msg.content, msg.id)}
                              title="Copy pesan"
                              className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md border border-[rgba(123,229,255,0.14)] bg-[rgba(255,255,255,0.05)] hover:border-[rgba(123,229,255,0.24)] hover:text-[var(--accent)] text-[var(--text-dim)]"
                            >
                              {copiedId === msg.id ? "✓ Tersalin" : "⎘ Copy"}
                            </button>
                          )}
                        </div>

                        {/* Bubble */}
                        {msg.role === "user" ? (
                          <div className="inline-block max-w-full bg-[rgba(123,229,255,0.12)] border border-[rgba(123,229,255,0.14)] rounded-[14px] px-4 py-3 text-sm leading-[1.7] text-[var(--text)] whitespace-pre-wrap break-words shadow-[0_8px_20px_rgba(0,0,0,0.08)]">
                            {msg.content}
                          </div>
                        ) : (
                          <div className="inline-block max-w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-[14px] px-4 py-3 text-sm leading-[1.7] text-[var(--text)] whitespace-pre-wrap break-words shadow-[0_8px_20px_rgba(0,0,0,0.06)]">
                            {msg.content === "" ? <TypingDot /> : msg.content}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {isLastMsgAI && !isLoading && (
                  <div className="max-w-[760px] mx-auto px-5 py-2 flex items-center gap-3">
                    <div className="h-px flex-1 bg-[#2a2a30]" />
                    <button
                      onClick={regenerateLast}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-[11px] text-[var(--text-dim)] border border-[rgba(123,229,255,0.12)] bg-[rgba(255,255,255,0.04)] hover:border-[rgba(123,229,255,0.2)] hover:text-[var(--text)] transition-all"
                      title="Minta jawaban baru"
                    >
                      🔄 Regenerate
                    </button>
                    <div className="h-px flex-1 bg-[#2a2a30]" />
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ══ Input area ══ */}
          <div className="px-6 pt-4 pb-5 border-t border-[rgba(123,229,255,0.1)] bg-[rgba(6,8,18,0.88)] flex-shrink-0 backdrop-blur-md">
            <div className="max-w-[760px] mx-auto flex gap-2.5 bg-[rgba(255,255,255,0.05)] border border-[rgba(123,229,255,0.12)] rounded-[20px] px-3 py-2.5 transition-all focus-within:border-[rgba(123,229,255,0.2)] focus-within:shadow-[0_0_0_3px_rgba(123,229,255,0.12)]">
              <textarea
                ref={inputRef}
                rows={1}
                placeholder="Ketik pesan… (Enter kirim, Shift+Enter baris baru)"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height =
                    Math.min(e.target.scrollHeight, 160) + "px";
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                className="flex-1 bg-transparent border-none outline-none text-[var(--text)] text-sm leading-relaxed resize-none min-h-[24px] max-h-[160px] py-0.5 placeholder-[var(--text-dim)]"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                title="Kirim"
                className="w-10 h-10 bg-[var(--accent)] rounded-2xl text-[var(--bg)] text-[15px] flex items-center justify-center self-end flex-shrink-0 border-none transition-all hover:scale-105 disabled:opacity-45 disabled:cursor-not-allowed"
              >
                {isLoading ? "⏳" : "➤"}
              </button>
            </div>
            <div className="max-w-[760px] mx-auto mt-2 text-center text-[11px] text-[var(--text-dim)]">
              Powered by Groq · llama-3.3-70b-versatile · Free tier
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
