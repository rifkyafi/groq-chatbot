// src/app/SystemPromptModal.jsx
// Fitur 3: Custom System Prompt
// Cara kerja: user isi textarea → disimpan di state → dikirim sebagai
//   { role: "system", content: "..." } di awal array messages ke API

"use client";

import { useState, useEffect, useRef } from "react";

// Preset siap pakai — user bisa pilih atau tulis sendiri
const PRESETS = [
  {
    label: "🤖 Default",
    value: "Kamu adalah asisten AI yang ramah dan membantu.",
  },
  {
    label: "👨‍🏫 Guru",
    value:
      "Kamu adalah guru yang sabar. Jelaskan semua konsep dengan bahasa sederhana, gunakan analogi, dan berikan contoh nyata. Selalu tanya apakah penjelasan sudah dipahami.",
  },
  {
    label: "💻 Senior Dev",
    value:
      "Kamu adalah senior software engineer. Jawab pertanyaan teknis secara langsung, sertakan kode yang siap pakai, dan jelaskan tradeoff dari setiap keputusan.",
  },
  {
    label: "✍️ Penulis",
    value:
      "Kamu adalah editor dan penulis profesional. Bantu memperbaiki tulisan agar lebih jelas, engaging, dan mengalir natural. Berikan saran konkret.",
  },
  {
    label: "🔍 Analis",
    value:
      "Kamu adalah analis data yang teliti. Gunakan pendekatan logis dan berbasis data. Selalu pertimbangkan berbagai sudut pandang sebelum menyimpulkan.",
  },
];

export default function SystemPromptModal({ isOpen, onClose, value, onChange }) {
  const [draft, setDraft] = useState(value || PRESETS[0].value);
  const textareaRef = useRef(null);

  // Sync prop → draft saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setDraft(value || PRESETS[0].value);
      // Auto-focus textarea setelah animasi
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen, value]);

  function handleSave() {
    onChange(draft.trim() || PRESETS[0].value); // fallback ke default jika kosong
    onClose();
  }

  function handleKeyDown(e) {
    if (e.key === "Escape") onClose();
  }

  if (!isOpen) return null;

  return (
    // Backdrop — klik di luar untuk tutup
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      {/* Modal box — stopPropagation agar klik dalam tidak tutup modal */}
      <div
        className="w-full max-w-lg mx-4 bg-[#17171a] border border-[#2a2a30] rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.6)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "modalIn 0.2s ease" }}
      >
        <style>{`
          @keyframes modalIn {
            from { opacity: 0; transform: scale(0.96) translateY(8px); }
            to   { opacity: 1; transform: scale(1)    translateY(0); }
          }
        `}</style>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a30]">
          <div>
            <h2 className="text-sm font-semibold text-[#e8e8f0]">
              ⚙️ System Prompt
            </h2>
            <p className="text-[11px] text-[#6b6b7d] mt-0.5">
              Tentukan "kepribadian" asisten untuk sesi ini
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[#6b6b7d] hover:text-[#e8e8f0] hover:bg-[#2a2a30] transition-colors text-xs"
          >
            ✕
          </button>
        </div>

        {/* Preset chips */}
        <div className="px-5 pt-4 pb-3">
          <p className="text-[10.5px] font-semibold text-[#6b6b7d] uppercase tracking-wider mb-2">
            Preset cepat
          </p>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => {
              const isActive = draft === p.value;
              return (
                <button
                  key={p.label}
                  onClick={() => setDraft(p.value)}
                  className="text-[11px] px-2.5 py-1 rounded-full border transition-all cursor-pointer"
                  style={{
                    background: isActive ? "rgba(124,106,247,0.15)" : "#1e1e22",
                    borderColor: isActive ? "rgba(124,106,247,0.5)" : "#2a2a30",
                    color: isActive ? "#a78bfa" : "#9595a8",
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Textarea */}
        <div className="px-5 pb-4">
          <p className="text-[10.5px] font-semibold text-[#6b6b7d] uppercase tracking-wider mb-2">
            Atau tulis sendiri
          </p>
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={5}
            placeholder="Contoh: Kamu adalah asisten hukum yang menjawab hanya berdasarkan hukum Indonesia…"
            className="w-full bg-[#1e1e22] border border-[#2a2a30] rounded-xl px-3 py-2.5 text-sm text-[#e8e8f0] placeholder-[#6b6b7d] outline-none resize-none leading-relaxed transition-colors focus:border-violet-500"
          />
          {/* Karakter counter */}
          <div className="flex justify-end mt-1">
            <span className="text-[10px] text-[#6b6b7d] font-mono">
              {draft.length} karakter
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 pb-4 gap-3">
          {/* Info */}
          <p className="text-[10px] text-[#6b6b7d] leading-relaxed max-w-[240px]">
            💡 Dikirim sebagai{" "}
            <code className="font-mono text-violet-400">role: &quot;system&quot;</code>{" "}
            di awal setiap request
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-[12px] rounded-xl border border-[#2a2a30] text-[#9595a8] hover:bg-[#1e1e22] transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-[12px] rounded-xl bg-violet-500 text-white font-semibold hover:opacity-85 transition-opacity"
            >
              Simpan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}