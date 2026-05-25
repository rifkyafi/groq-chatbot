import { useState, useEffect, useRef } from "react";
import { streamChat } from "../services/chatService";

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

export function useChatManager(userEmail, systemPrompt) {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState("");
  const inputRef = useRef(null);

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null;

  // ── Persistence ──
  const storageKey = userEmail ? `chats:${userEmail}` : null;
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

  // ── Actions ──
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
    const nextChats = chats.filter((c) => c.id !== id);
    setChats(nextChats);
    if (activeChatId === id) {
      setActiveChatId(nextChats[0]?.id ?? null);
    }
  }

  function renameChat(id, newTitle) {
    setChats((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
    );
  }

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
        })
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
        })
      );
      setInput("");
    }

    setIsLoading(true);

    try {
      await streamChat(
        [{ role: "system", content: systemPrompt }, ...historyForAPI.map(({ role, content }) => ({ role, content }))],
        (accumulated) => {
          setChats((prev) =>
            prev.map((c) =>
              c.id !== chatId
                ? c
                : {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.id !== assistantMsgId ? m : { ...m, content: accumulated }
                    ),
                    updatedAt: Date.now(),
                  }
            )
          );
        }
      );
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
                    : { ...m, content: `⚠️ Error: ${err.message}` }
                ),
              }
        )
      );
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

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
        c.id !== activeChatId ? c : { ...c, messages: messagesWithoutLastAI }
      )
    );

    sendMessage(messagesWithoutLastAI);
  }

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
        await streamChat(
          [{ role: "system", content: systemPrompt }, { role: "user", content: text }],
          (accumulated) => {
            setChats((prev) =>
              prev.map((c) =>
                c.id !== chatId
                  ? c
                  : {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id !== assistantMsgId ? m : { ...m, content: accumulated }
                      ),
                      updatedAt: Date.now(),
                    }
              )
            );
          }
        );
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
                      : { ...m, content: `⚠️ Error: ${err.message}` }
                  ),
                }
          )
        );
      } finally {
        setIsLoading(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    })();
  }

  return {
    chats,
    activeChatId,
    setActiveChatId,
    activeChat,
    hydrated,
    isLoading,
    input,
    setInput,
    inputRef,
    createNewChat,
    deleteChat,
    renameChat,
    sendMessage,
    regenerateLast,
    startChatWithSuggestion,
  };
}
