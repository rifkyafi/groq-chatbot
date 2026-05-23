// src/app/SystemPromptModal.jsx
"use client";

import { useState, useEffect } from "react";

const PRESETS = [
  {
    name: "Default",
    value: "Kamu adalah asisten AI yang ramah dan membantu.",
  },
  {
    name: "Guru",
    value:
      "Kamu adalah seorang guru yang sabar dan terampil menjelaskan konsep kompleks dengan cara yang mudah dipahami.",
  },
  {
    name: "Senior Dev",
    value:
      "Kamu adalah senior developer dengan 10+ tahun pengalaman. Jelaskan dengan detail teknis dan best practices.",
  },
  {
    name: "Penulis",
    value:
      "Kamu adalah penulis profesional yang kreatif dan berbakat dalam menghasilkan konten berkualitas tinggi.",
  },
  {
    name: "Analis",
    value:
      "Kamu adalah analis data yang detail dan kritis. Berikan insight mendalam dengan data dan logika.",
  },
];

export default function SystemPromptModal({ isOpen, onClose, value, onChange }) {
  const [input, setInput] = useState(value);

  useEffect(() => {
    setInput(value);
  }, [value]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[99] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div
          className="w-full max-w-2xl bg-[#17171a] border border-[#2a2a30] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
          onClick={(e) => e.stopPropagation()}
          style={{ animation: "msgIn 0.2s ease" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2a30]">
            <h2 className="text-lg font-semibold text-[#e8e8f0]">
              ⚙️ Atur System Prompt
            </h2>
            <button
              onClick={onClose}
              className="text-[#6b6b7d] hover:text-[#e8e8f0] transition-colors text-2xl leading-none"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[70vh] overflow-y-auto thin-scroll">
            {/* Presets */}
            <div className="mb-6">
              <p className="text-xs font-semibold text-[#6b6b7d] uppercase tracking-wider mb-3">
                Preset Cepat
              </p>
              <div className="grid grid-cols-2 gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => setInput(preset.value)}
                    className="px-3 py-2 rounded-lg border border-[#2a2a30] bg-[#1e1e22] text-[12px] text-[#9595a8] cursor-pointer transition-all hover:border-violet-500 hover:text-violet-400 text-left"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <div>
              <label className="text-xs font-semibold text-[#6b6b7d] uppercase tracking-wider mb-2 block">
                Custom Prompt
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full bg-[#0f0f11] border border-[#2a2a30] rounded-lg px-3 py-2.5 text-sm text-[#e8e8f0] focus:border-violet-500 focus:outline-none resize-none min-h-[120px]"
                placeholder="Tulis instruksi untuk AI..."
              />
              <div className="text-[10px] text-[#6b6b7d] mt-2">
                Karakter: {input.length}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-2 px-6 py-4 border-t border-[#2a2a30]">
            <button
              onClick={onClose}
              className="flex-1 px-3 py-2 rounded-lg border border-[#2a2a30] bg-[#1e1e22] text-sm text-[#9595a8] cursor-pointer transition-all hover:border-[#6b6b7d]"
            >
              Batal
            </button>
            <button
              onClick={() => {
                onChange(input);
                onClose();
              }}
              className="flex-1 px-3 py-2 rounded-lg bg-violet-500 text-sm text-white font-medium cursor-pointer transition-all hover:opacity-85 hover:scale-105"
            >
              ✓ Simpan
            </button>
          </div>
        </div>
      </div>
    </>
  );
}