// src/lib/useExportChat.js
// Fitur 2: Export chat ke file
// Mendukung 3 format: JSON, TXT, Markdown
// Cara kerja: buat Blob → buat URL sementara → klik link → hapus URL

export function useExportChat() {

  // ── Format helpers ─────────────────────────────────────────────────────────

  function toJSON(chat) {
    // Export mentah — berguna buat developer / backup
    return JSON.stringify(
      {
        title: chat.title,
        exportedAt: new Date().toISOString(),
        messages: chat.messages.map((m) => ({
          role: m.role,
          content: m.content,
          time: new Date(m.ts).toLocaleString("id-ID"),
        })),
      },
      null,
      2 // pretty-print dengan indent 2 spasi
    );
  }

  function toTXT(chat) {
    // Format polos — paling mudah dibaca manusia
    const lines = [
      `=== ${chat.title} ===`,
      `Diekspor: ${new Date().toLocaleString("id-ID")}`,
      "",
    ];
    chat.messages.forEach((m) => {
      const who = m.role === "user" ? "Kamu" : "Asisten";
      const time = new Date(m.ts).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });
      lines.push(`[${time}] ${who}:`);
      lines.push(m.content);
      lines.push(""); // baris kosong antar pesan
    });
    return lines.join("\n");
  }

  function toMarkdown(chat) {
    // Format markdown — bagus buat Notion, Obsidian, GitHub
    const lines = [
      `# ${chat.title}`,
      `> Diekspor: ${new Date().toLocaleString("id-ID")}`,
      "",
    ];
    chat.messages.forEach((m) => {
      const who = m.role === "user" ? "**Kamu**" : "**Asisten**";
      const time = new Date(m.ts).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });
      lines.push(`### ${who} — ${time}`);
      lines.push("");
      lines.push(m.content);
      lines.push("");
      lines.push("---");
      lines.push("");
    });
    return lines.join("\n");
  }

  // ── Download trigger ────────────────────────────────────────────────────────

  function downloadFile(content, filename, mimeType) {
    // 1. Buat Blob dari string konten
    const blob = new Blob([content], { type: mimeType });

    // 2. Buat URL sementara yang menunjuk ke Blob
    const url = URL.createObjectURL(blob);

    // 3. Buat <a> invisible, set href + download, lalu klik
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    // 4. Bersihkan: hapus element & bebaskan memori URL
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  function exportChat(chat, format = "markdown") {
    if (!chat || !chat.messages?.length) return;

    // Buat nama file yang aman (hapus karakter spesial)
    const safeName = chat.title
      .replace(/[^a-z0-9\s-]/gi, "")
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase()
      .slice(0, 50) || "chat";

    const timestamp = new Date()
      .toISOString()
      .slice(0, 10); // "2025-05-07"

    const filename = `${safeName}_${timestamp}`;

    switch (format) {
      case "json":
        downloadFile(toJSON(chat), `${filename}.json`, "application/json");
        break;
      case "txt":
        downloadFile(toTXT(chat), `${filename}.txt`, "text/plain");
        break;
      case "markdown":
      default:
        downloadFile(toMarkdown(chat), `${filename}.md`, "text/markdown");
        break;
    }
  }

  return { exportChat };
}