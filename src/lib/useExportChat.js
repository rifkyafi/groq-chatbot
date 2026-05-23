// src/lib/useExportChat.js
"use client";

import { useCallback } from "react";

export function useExportChat() {
  const formatTime = (ts) => {
    return new Date(ts).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const exportChat = useCallback((chat, format) => {
    let content = "";
    let filename = `chat_${chat.id.substring(0, 8)}_${Date.now()}`;

    if (format === "markdown") {
      content = chat.messages
        .map((msg) => {
          const role = msg.role === "user" ? "👤 Kamu" : "🤖 Asisten";
          const time = formatTime(msg.ts);
          return `**${role}** *(${time})*\n\n${msg.content}\n`;
        })
        .join("\n---\n\n");
      filename += ".md";
    } else if (format === "txt") {
      content = chat.messages
        .map((msg) => {
          const role = msg.role === "user" ? "Kamu" : "Asisten";
          const time = formatTime(msg.ts);
          return `[${time}] ${role}\n${msg.content}`;
        })
        .join("\n\n" + "=".repeat(50) + "\n\n");
      filename += ".txt";
    } else if (format === "json") {
      content = JSON.stringify(
        {
          title: chat.title,
          createdAt: new Date(chat.createdAt).toISOString(),
          updatedAt: new Date(chat.updatedAt).toISOString(),
          messages: chat.messages,
        },
        null,
        2
      );
      filename += ".json";
    }

    // Download
    const blob = new Blob([content], {
      type: format === "json" ? "application/json" : "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return { exportChat };
}