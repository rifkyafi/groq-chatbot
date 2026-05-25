"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// ── Fitur baru ──
import { useExportChat } from "@/lib/useExportChat";
import SystemPromptModal from "./SystemPromptModal";

// ── Sub-components ──
import ChatSidebar from "./ChatSidebar";
import ChatMain from "./ChatMain";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function generateId() {
  return Math.random().toString(36).substring(2, 10);
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
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") setIsDark(false);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

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
  const { exportChat } = useExportChat();

  // ── Refs ──
  const inputRef = useRef(null);

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null;

  // ── Persist ke localStorage per-user (namespace by email) ──
  const storageKey = session?.user?.email
    ? `chats:${session.user.email}`
    : null;

  const [loadedStorageKey, setLoadedStorageKey] = useState(null);

  useEffect(() => {
    if (!storageKey) {
      setHydrated(true);
      return;
    }
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setChats(JSON.parse(saved));
      else setChats([]);
    } catch (_) {}
    setLoadedStorageKey(storageKey);
    setHydrated(true);
  }, [storageKey]);

  useEffect(() => {
    if (loadedStorageKey === storageKey && storageKey) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(chats));
      } catch (_) {}
    }
  }, [chats, storageKey, loadedStorageKey]);

  // Persist system prompt terpisah
  useEffect(() => {
    localStorage.setItem("systemPrompt", systemPrompt);
  }, [systemPrompt]);
  
  useEffect(() => {
    const saved = localStorage.getItem("systemPrompt");
    if (saved) setSystemPrompt(saved);
  }, []);

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
                content: `Berikan 4 topik pertanyaan yang sedang ramai dibahas di Indonesia sekarang. Format respons HANYA JSON array murni:\n[\n  {"emoji": "emoji relevan", "kategori": "2-3 kata kategori", "pertanyaan": "pertanyaan menarik bahasa Indonesia, max 10 kata"},\n  {"emoji": "...", "kategori": "...", "pertanyaan": "..."},\n  {"emoji": "...", "kategori": "...", "pertanyaan": "..."},\n  {"emoji": "...", "kategori": "...", "pertanyaan": "..."}\n]`,
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

  function renameChat(id, newTitle) {
    setChats((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, title: newTitle } : c,
      ),
    );
  }

  // ── FIX: Klik suggestion → buat chat baru + langsung kirim ───────────────
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

  // ── Guard ──
  if (status === "loading" || status === "unauthenticated" || !hydrated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[var(--bg)] text-[#6b6b7d] text-sm">
        <span className="text-4xl">🤖</span>
        <span className="animate-pulse">Memuat sesi…</span>
      </div>
    );
  }

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
        <ChatSidebar
          sidebarOpen={sidebarOpen}
          createNewChat={createNewChat}
          setShowSystemModal={setShowSystemModal}
          systemPrompt={systemPrompt}
          chats={chats}
          activeChatId={activeChatId}
          setActiveChatId={setActiveChatId}
          onRenameChat={renameChat}
          onDeleteChat={deleteChat}
        />

        <ChatMain
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          isDark={isDark}
          setIsDark={setIsDark}
          activeChat={activeChat}
          showSystemBadge={showSystemBadge}
          exportChat={exportChat}
          session={session}
          loadingSuggestions={loadingSuggestions}
          suggestions={suggestions}
          startChatWithSuggestion={startChatWithSuggestion}
          isLoading={isLoading}
          regenerateLast={regenerateLast}
          inputRef={inputRef}
          input={input}
          setInput={setInput}
          sendMessage={sendMessage}
        />
      </div>
    </>
  );
}
