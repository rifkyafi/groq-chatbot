import { useState, useRef, useEffect } from "react";

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

export default function ChatSidebar({
  sidebarOpen,
  createNewChat,
  setShowSystemModal,
  systemPrompt,
  chats,
  activeChatId,
  setActiveChatId,
  onRenameChat,
  onDeleteChat,
}) {
  const [hoveredChat, setHoveredChat] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const editInputRef = useRef(null);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  function startRename(chat) {
    setEditingId(chat.id);
    setEditingTitle(chat.title);
  }

  function commitRename(id) {
    if (editingTitle.trim()) {
      onRenameChat(id, editingTitle.trim());
    }
    setEditingId(null);
  }

  const groupedChats = chats.reduce((acc, chat) => {
    const label = formatDate(chat.updatedAt);
    if (!acc[label]) acc[label] = [];
    acc[label].push(chat);
    return acc;
  }, {});

  return (
    <aside
      className="flex flex-col flex-shrink-0 bg-[var(--surface)] border-r border-[var(--border)] overflow-hidden transition-all duration-200"
      style={{ width: sidebarOpen ? 260 : 0, opacity: sidebarOpen ? 1 : 0 }}
    >
      <div className="flex flex-col px-4 pt-[18px] pb-[14px] border-b border-[var(--border)] gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-semibold tracking-tight whitespace-nowrap">
            Groq<span className="text-[var(--accent)]">Chat</span>
          </span>
        </div>

        <button
          onClick={createNewChat}
          className="flex items-center gap-2 px-3 py-2 bg-[var(--surface2)] border border-[var(--border)] rounded-2xl text-[var(--accent)] text-[13px] font-medium cursor-pointer transition-all hover:bg-[var(--surface2)] hover:border-[var(--border-bright)]"
        >
          <span className="text-[14px]">+</span> Chat Baru
        </button>

        <button
          onClick={() => setShowSystemModal(true)}
          className="flex items-center gap-2 px-3 py-2 bg-[var(--ai-bg)] border border-[var(--border)] rounded-2xl text-[var(--text-dim)] text-[12px] cursor-pointer transition-all hover:border-[var(--border-bright)] hover:text-[var(--text)]"
          title="Atur kepribadian asisten"
        >
          <span className="text-[14px]">⚙</span>
          <span className="flex-1 text-left truncate">System Prompt</span>
          {systemPrompt !== "Kamu adalah asisten AI yang ramah dan membantu." && (
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] flex-shrink-0" />
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2.5 pb-4 thin-scroll">
        {chats.length === 0 && (
          <p className="text-center text-[var(--text-muted)] text-xs py-6 px-2">
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
                      className="flex-1 bg-[var(--ai-bg)] border border-[var(--border)] rounded px-1.5 py-0.5 text-xs text-[var(--text)] outline-none"
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
                        className="w-6 h-6 flex items-center justify-center rounded text-xs text-[var(--text-dim)] bg-transparent border-none cursor-pointer transition-all hover:text-[var(--text)] hover:bg-[var(--ai-bg)]"
                      >
                        ✏️
                      </button>
                      <button
                        title="Hapus"
                        onClick={() => onDeleteChat(chat.id)}
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
  );
}
