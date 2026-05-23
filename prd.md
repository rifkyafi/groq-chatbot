# 📋 Product Requirements Document (PRD)

## GroqChat — AI Chatbot berbasis Groq

| Field              | Detail                                          |
| ------------------ | ----------------------------------------------- |
| **Nama Produk**    | GroqChat                                        |
| **Versi**          | 0.1.0                                           |
| **Tanggal**        | 23 Mei 2026                                     |
| **Status**         | MVP — Aktif digunakan                           |
| **Tech Stack**     | Next.js 16 · React 19 · Groq API · NextAuth v5 |
| **Model AI**       | LLaMA 3.3 70B Versatile (via Groq)              |
| **Target Audiens** | Pengguna umum berbahasa Indonesia               |

---

## 1. Ringkasan Produk

**GroqChat** adalah aplikasi chatbot web berbasis AI yang memanfaatkan **Groq API** (LLaMA 3.3 70B) untuk memberikan respons percakapan secara **real-time streaming**. Aplikasi ini dibangun dengan Next.js 16 dan React 19, menggunakan dark-themed UI yang modern, serta dilengkapi sistem autentikasi melalui GitHub OAuth.

### Unique Value Proposition

- ⚡ **Ultra-fast inference** — Groq LPU menyediakan kecepatan inferensi jauh lebih cepat dari GPU tradisional
- 🆓 **Gratis selamanya** — Menggunakan free tier Groq API tanpa biaya
- 🇮🇩 **Dioptimalkan untuk bahasa Indonesia** — System prompt dan UI dalam bahasa Indonesia
- 🔒 **Data lokal** — Riwayat chat disimpan di `localStorage` browser, bukan di server

---

## 2. Tujuan & Sasaran

### Tujuan Bisnis
- Menyediakan chatbot AI gratis yang mudah diakses untuk pengguna Indonesia
- Mendemonstrasikan kemampuan Groq API sebagai alternatif OpenAI/DeepSeek

### Tujuan Teknis
- Membangun arsitektur streaming yang efisien untuk pengalaman chat real-time
- Implementasi autentikasi OAuth yang aman dengan NextAuth v5
- Menjaga data privasi pengguna dengan penyimpanan client-side

### Metrik Keberhasilan
- Waktu respons pertama (TTFB) < 500ms
- Chat streaming tanpa buffering terlihat
- Halaman login → chat dalam < 3 klik

---

## 3. Arsitektur Sistem

### 3.1 Diagram Arsitektur

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENT (Browser)                   │
│                                                         │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  Login Page  │  │   ChatApp    │  │  localStorage │  │
│  │  (OAuth)     │→ │  (Main UI)   │↔ │  - chats      │  │
│  └─────────────┘  │              │  │  - systemPrompt│  │
│                   │  ┌──────────┐│  │  - suggestions │  │
│                   │  │ Messages ││  └───────────────┘  │
│                   │  │ Sidebar  ││                      │
│                   │  │ Input    ││                      │
│                   │  │ Export   ││                      │
│                   │  └──────────┘│                      │
│                   └──────┬───────┘                      │
└──────────────────────────┼──────────────────────────────┘
                           │ HTTP POST (streaming)
                           ▼
┌──────────────────────────────────────────────────────────┐
│                    SERVER (Next.js API)                   │
│                                                          │
│  ┌─────────────────┐    ┌────────────────────────┐       │
│  │  /api/chat      │    │  /api/auth/[...nextauth]│      │
│  │  (route.js)     │    │  (NextAuth v5)          │      │
│  │  - Validasi     │    │  - GitHub OAuth         │      │
│  │  - Streaming    │    │  - Session management   │      │
│  └────────┬────────┘    └────────────────────────┘       │
│           │                                              │
│  ┌────────┴────────┐    ┌────────────────────────┐       │
│  │  Middleware      │    │  auth.js (NextAuth)    │       │
│  │  - Auth guard    │    │  - GitHub provider     │       │
│  │  - Route protect │    │  - Session callbacks   │       │
│  └─────────────────┘    └────────────────────────┘       │
└──────────────────────────┼───────────────────────────────┘
                           │ OpenAI-compatible API
                           ▼
              ┌────────────────────────┐
              │   Groq Cloud API       │
              │   api.groq.com         │
              │   Model: llama-3.3-70b │
              └────────────────────────┘
```

### 3.2 Struktur File

```
groq-chatbot/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/     ← NextAuth route handlers
│   │   │   └── chat/route.js           ← API endpoint streaming chat
│   │   ├── login/page.jsx              ← Halaman login (GitHub OAuth)
│   │   ├── ChatApp.jsx                 ← Komponen utama chat (863 baris)
│   │   ├── SystemPromptModal.jsx       ← Modal konfigurasi system prompt
│   │   ├── LogoutButton.jsx            ← Tombol logout
│   │   ├── Providers.jsx               ← SessionProvider wrapper
│   │   ├── page.jsx                    ← Entry point (dynamic import)
│   │   ├── layout.jsx                  ← Root layout + metadata
│   │   ├── globals.css                 ← Global styles
│   │   └── page.module.css             ← CSS module halaman chat
│   ├── lib/
│   │   ├── deepseek.js                 ← (Legacy) DeepSeek client (disabled)
│   │   ├── useCopyToClipboard.js       ← Hook: copy pesan ke clipboard
│   │   └── useExportChat.js            ← Hook: export chat ke file
│   ├── auth.js                         ← Konfigurasi NextAuth
│   └── middleware.js                   ← Auth middleware (route protection)
├── server.js                           ← Custom HTTP server (production)
├── ecosystem.config.js                 ← PM2 deployment config
├── .env.local                          ← Environment variables (secret)
├── .env.example                        ← Template env
├── tailwind.config.js                  ← TailwindCSS config
├── next.config.js                      ← Next.js config
└── package.json                        ← Dependencies & scripts
```

---

## 4. Tech Stack & Dependencies

### 4.1 Production Dependencies

| Package          | Versi     | Fungsi                                |
| ---------------- | --------- | ------------------------------------- |
| `next`           | ^16.2.4   | Framework React full-stack            |
| `react`          | ^19.2.5   | UI library                            |
| `react-dom`      | ^19.2.5   | React DOM renderer                    |
| `next-auth`      | ^5.0.0β31 | Autentikasi (GitHub OAuth)            |
| `openai`         | ^4.104.0  | Client SDK untuk Groq API (kompatibel)|
| `@tavily/core`   | ^0.7.3    | (Tersedia, belum digunakan aktif)     |

### 4.2 Dev Dependencies

| Package              | Versi    | Fungsi             |
| -------------------- | -------- | ------------------- |
| `tailwindcss`        | ^3.4.19  | Utility-first CSS   |
| `postcss`            | ^8.5.13  | CSS processor       |
| `autoprefixer`       | ^10.5.0  | CSS auto-prefixing  |
| `eslint`             | ^10.3.0  | Linter              |
| `eslint-config-next` | ^16.2.4  | ESLint Next.js rules|

### 4.3 External Services

| Service       | Kegunaan                          | Endpoint                          |
| ------------- | --------------------------------- | --------------------------------- |
| **Groq API**  | LLM inference (streaming)        | `https://api.groq.com/openai/v1`  |
| **GitHub OAuth** | Autentikasi pengguna           | Via NextAuth                      |
| **Google Fonts** | Font Sora & JetBrains Mono     | CDN                               |

---

## 5. Fitur Produk

### 5.1 Autentikasi & Keamanan

| ID    | Fitur                          | Status | Deskripsi                                                                 |
| ----- | ------------------------------ | ------ | ------------------------------------------------------------------------- |
| AU-01 | Login via GitHub OAuth         | ✅ Done | Autentikasi menggunakan GitHub provider via NextAuth v5                   |
| AU-02 | Session management             | ✅ Done | Session token dikelola otomatis oleh NextAuth                             |
| AU-03 | Route protection (middleware)  | ✅ Done | Semua halaman kecuali `/login` dan `/api/auth/*` dilindungi middleware    |
| AU-04 | Redirect ke login              | ✅ Done | User yang belum login otomatis diarahkan ke `/login` dengan callbackUrl   |
| AU-05 | Logout                         | ✅ Done | Tombol logout di user menu, redirect ke halaman login                     |
| AU-06 | User profile display           | ✅ Done | Menampilkan nama, email, dan foto profil GitHub di topbar                 |

### 5.2 Chat Core

| ID    | Fitur                          | Status | Deskripsi                                                                 |
| ----- | ------------------------------ | ------ | ------------------------------------------------------------------------- |
| CH-01 | Streaming response             | ✅ Done | Teks muncul bertahap via ReadableStream — pengalaman real-time            |
| CH-02 | Multi-turn conversation        | ✅ Done | Riwayat pesan dikirim bersama setiap request untuk konteks percakapan     |
| CH-03 | Multiple chat sessions         | ✅ Done | User dapat membuat dan mengelola banyak sesi chat secara bersamaan        |
| CH-04 | Auto-title dari pesan pertama  | ✅ Done | Judul chat otomatis diambil dari 40 karakter pertama pesan user           |
| CH-05 | Typing indicator               | ✅ Done | Animasi 3 titik berkedip saat menunggu respons AI                         |
| CH-06 | Loading state                  | ✅ Done | Tombol kirim berubah menjadi ⏳ saat proses berlangsung                   |
| CH-07 | Error handling                 | ✅ Done | Pesan error ditampilkan inline (HTTP error, rate limit, API key invalid)  |
| CH-08 | Regenerate response            | ✅ Done | Tombol 🔄 Regenerate untuk meminta ulang jawaban terakhir AI              |
| CH-09 | Keyboard shortcuts             | ✅ Done | Enter = kirim, Shift+Enter = baris baru                                  |

### 5.3 Manajemen Chat

| ID    | Fitur                          | Status | Deskripsi                                                                 |
| ----- | ------------------------------ | ------ | ------------------------------------------------------------------------- |
| MG-01 | Sidebar chat list              | ✅ Done | Sidebar collapsible menampilkan daftar semua chat                         |
| MG-02 | Grouped by date                | ✅ Done | Chat dikelompokkan: Hari ini, Kemarin, Minggu ini, atau tanggal spesifik |
| MG-03 | Create new chat                | ✅ Done | Tombol ✏️ Chat Baru di sidebar                                           |
| MG-04 | Rename chat                    | ✅ Done | Inline editing judul chat di sidebar (hover → klik ✏️)                   |
| MG-05 | Delete chat                    | ✅ Done | Tombol hapus 🗑️ muncul saat hover di sidebar                            |
| MG-06 | Persist ke localStorage        | ✅ Done | Semua data chat disimpan di browser, bertahan setelah refresh             |
| MG-07 | Toggle sidebar                 | ✅ Done | Tombol ◀/▶ di topbar untuk show/hide sidebar dengan animasi smooth       |

### 5.4 Suggestion Prompts

| ID    | Fitur                          | Status | Deskripsi                                                                 |
| ----- | ------------------------------ | ------ | ------------------------------------------------------------------------- |
| SG-01 | Dynamic suggestions            | ✅ Done | 4 topik trending Indonesia dihasilkan AI secara dinamis saat load         |
| SG-02 | Skeleton loading               | ✅ Done | Skeleton card dengan animasi shimmer saat suggestions loading             |
| SG-03 | One-click start                | ✅ Done | Klik suggestion langsung buat chat baru + kirim pertanyaan                |
| SG-04 | Cache suggestions              | ✅ Done | Suggestions disimpan di localStorage agar tidak reload setiap sesi        |

### 5.5 System Prompt (Kustomisasi AI)

| ID    | Fitur                          | Status | Deskripsi                                                                 |
| ----- | ------------------------------ | ------ | ------------------------------------------------------------------------- |
| SP-01 | Custom system prompt           | ✅ Done | User dapat menulis system prompt sendiri via modal                        |
| SP-02 | Preset cepat                   | ✅ Done | 5 preset: Default, Guru, Senior Dev, Penulis, Analis                     |
| SP-03 | Persist system prompt          | ✅ Done | System prompt disimpan di localStorage, bertahan antar sesi               |
| SP-04 | Character counter              | ✅ Done | Menampilkan jumlah karakter system prompt secara real-time                |
| SP-05 | Visual indicator               | ✅ Done | Dot indicator di sidebar jika system prompt bukan default                 |
| SP-06 | Save confirmation badge        | ✅ Done | Badge "✓ System prompt tersimpan" muncul 3 detik di topbar               |

### 5.6 Export & Utilitas

| ID    | Fitur                          | Status | Deskripsi                                                                 |
| ----- | ------------------------------ | ------ | ------------------------------------------------------------------------- |
| EX-01 | Export ke Markdown (.md)       | ✅ Done | Format heading + blockquote, cocok untuk Notion/Obsidian                  |
| EX-02 | Export ke Plain Text (.txt)    | ✅ Done | Format sederhana dengan timestamp per pesan                               |
| EX-03 | Export ke JSON (.json)         | ✅ Done | Format mentah dengan pretty-print, untuk backup/developer                 |
| EX-04 | Copy pesan ke clipboard        | ✅ Done | Tombol "⎘ Copy" muncul saat hover di setiap bubble pesan                 |
| EX-05 | Copy confirmation              | ✅ Done | Tombol berubah menjadi "✓ Tersalin" selama 2 detik setelah copy          |

### 5.7 UI/UX

| ID    | Fitur                          | Status | Deskripsi                                                                 |
| ----- | ------------------------------ | ------ | ------------------------------------------------------------------------- |
| UX-01 | Dark theme                     | ✅ Done | Tema gelap premium dengan warna violet accent                             |
| UX-02 | Responsive layout              | ✅ Done | Mobile-friendly dengan sidebar collapsible                                |
| UX-03 | Smooth animations              | ✅ Done | Animasi: shimmer, blink, msgIn, dropIn, slideIn, modalIn                  |
| UX-04 | Auto-scroll ke pesan terbaru   | ✅ Done | Scroll otomatis ke bawah setiap ada pesan baru                            |
| UX-05 | Auto-resize textarea           | ✅ Done | Textarea input otomatis membesar sesuai isi (max 160px)                   |
| UX-06 | Custom scrollbar               | ✅ Done | Thin scrollbar yang konsisten dengan dark theme                           |
| UX-07 | Typography: Sora + JetBrains  | ✅ Done | Font Sora untuk teks umum, JetBrains Mono untuk monospace                 |
| UX-08 | User avatar dari GitHub        | ✅ Done | Foto profil GitHub ditampilkan di topbar dan user menu                    |
| UX-09 | Light/Dark toggle (login page) | ✅ Done | Toggle tema terang/gelap tersedia di halaman login                        |

---

## 6. Alur Data (Data Flow)

### 6.1 Alur Autentikasi

```
User → Buka halaman
  → Middleware cek session
    → Belum login → Redirect ke /login?callbackUrl=/
      → User klik "Lanjutkan dengan GitHub"
        → GitHub OAuth flow
          → Callback ke /api/auth/callback/github
            → NextAuth buat session
              → Redirect ke callbackUrl (/)
                → ChatApp dimuat
```

### 6.2 Alur Kirim Pesan

```
User mengetik pesan → Klik kirim / tekan Enter
  → ChatApp.sendMessage()
    → Tambah user message ke state
    → Tambah placeholder assistant message (kosong)
    → setIsLoading(true)
    → POST /api/chat
      Body: { messages: [system_prompt, ...history, user_msg] }
    → Server:
      → Validasi messages
      → Buat OpenAI client (Groq endpoint)
      → groq.chat.completions.create({ stream: true })
      → Buat ReadableStream
      → Kirim chunk per chunk
    → Client:
      → reader.read() loop
      → Akumulasi teks
      → Update assistant message content per chunk
      → UI re-render menampilkan teks bertahap
    → Stream selesai
      → setIsLoading(false)
      → Persist ke localStorage
```

### 6.3 Alur Suggestion

```
ChatApp mounted
  → useEffect: fetchSuggestions()
    → Cek cache di localStorage
      → Ada → Tampilkan cached, lanjut fetch baru
    → POST /api/chat (minta 4 topik trending)
    → Parse respons JSON dari dalam teks
    → setSuggestions(parsed)
    → Simpan ke localStorage
```

---

## 7. API Specification

### 7.1 POST `/api/chat`

**Request:**
```json
{
  "messages": [
    { "role": "system", "content": "Kamu adalah asisten AI..." },
    { "role": "user", "content": "Halo!" },
    { "role": "assistant", "content": "Halo! Ada yang bisa dibantu?" },
    { "role": "user", "content": "Apa itu Groq?" }
  ]
}
```

**Response:** `text/plain` streaming (bukan SSE)
```
Groq adalah perusahaan yang mengembangkan... [streamed chunk by chunk]
```

**Error Response:**
```json
{
  "error": "Rate limit tercapai. Tunggu sebentar lalu coba lagi."
}
```

**Status Codes:**

| Code | Kondisi                        |
| ---- | ------------------------------ |
| 200  | Sukses (streaming response)    |
| 400  | Format messages tidak valid    |
| 401  | API key tidak valid            |
| 429  | Rate limit tercapai            |
| 500  | Server error / API key missing |

### 7.2 API Parameters (Groq)

| Parameter     | Nilai                         | Keterangan                  |
| ------------- | ----------------------------- | --------------------------- |
| `model`       | `llama-3.3-70b-versatile`     | Dari env `GROQ_MODEL`       |
| `temperature` | `0.7`                         | Balance kreativitas/akurasi |
| `max_tokens`  | `2048`                        | Batas token per respons     |
| `stream`      | `true`                        | Aktifkan streaming          |

---

## 8. Environment Variables

| Variable         | Required | Deskripsi                          | Contoh                          |
| ---------------- | -------- | ---------------------------------- | ------------------------------- |
| `GROQ_API_KEY`   | ✅       | API key dari platform.groq.com    | `gsk_xxxxxxxxxxxxx`             |
| `GROQ_MODEL`     | ❌       | Model AI (default: llama-3.3-70b) | `llama-3.3-70b-versatile`       |
| `GITHUB_ID`      | ✅       | GitHub OAuth App Client ID        | `Ov23li...`                     |
| `GITHUB_SECRET`  | ✅       | GitHub OAuth App Client Secret    | `abc123...`                     |
| `AUTH_SECRET`     | ✅       | NextAuth secret key               | `random-string`                 |

---

## 9. Deployment

### 9.1 Development

```bash
npm run dev          # Jalankan dev server di localhost:3000
```

### 9.2 Production

```bash
npm run build        # Build production bundle
npm start            # Jalankan production server
```

### 9.3 PM2 (Production Process Manager)

Konfigurasi PM2 tersedia di `ecosystem.config.js`:
- **Mode:** Cluster (multi-instance, semua CPU core)
- **Memory limit:** 500MB per instance (auto-restart)
- **Logging:** `./logs/out.log` dan `./logs/error.log`
- **Port:** 3000

---

## 10. Penyimpanan Data

| Data             | Lokasi          | Persistence        | Keterangan                              |
| ---------------- | --------------- | ------------------- | --------------------------------------- |
| Chat messages    | `localStorage`  | Per browser/device  | Key: `chats`                            |
| System prompt    | `localStorage`  | Per browser/device  | Key: `systemPrompt`                     |
| Suggestions      | `localStorage`  | Per browser/device  | Key: `suggestions`                      |
| Auth session     | Cookie (httpOnly)| Managed by NextAuth | Otomatis expire sesuai konfigurasi      |
| Theme preference | `localStorage`  | Per browser/device  | Key: `theme` (untuk halaman login)      |

> ⚠️ **Catatan:** Tidak ada database server-side. Semua data chat tersimpan secara lokal di browser pengguna. Jika pengguna menghapus data browser, riwayat chat akan hilang.

---

## 11. Keterbatasan Saat Ini

| #  | Keterbatasan                                      | Dampak                                              |
| -- | ------------------------------------------------- | --------------------------------------------------- |
| 1  | Tidak ada database server-side                    | Data hilang jika browser dibersihkan                 |
| 2  | Tidak ada sinkronisasi antar device               | Chat di HP tidak muncul di laptop                   |
| 3  | Tidak ada markdown rendering di chat bubble       | Kode dan formatting AI ditampilkan sebagai teks biasa|
| 4  | Tidak ada rate limiting di sisi server             | Potensi abuse jika API key bocor                    |
| 5  | Tidak ada search/filter chat                       | Sulit menemukan chat lama jika banyak               |
| 6  | Belum ada konfirmasi hapus chat                    | Chat bisa terhapus tanpa sengaja                    |
| 7  | `@tavily/core` tersedia tapi belum diintegrasikan | Fitur web search belum aktif                        |
| 8  | Modul `deepseek.js` di-comment-out                | Kode legacy yang tidak terpakai                     |

---

## 12. Roadmap (Rencana Pengembangan)

### Phase 1 — Polish (Prioritas Tinggi)

| #  | Fitur                                | Deskripsi                                           |
| -- | ------------------------------------ | --------------------------------------------------- |
| 1  | Markdown rendering                   | Render kode, tabel, bold/italic di chat bubble      |
| 2  | Konfirmasi hapus chat                | Dialog "Yakin hapus?" sebelum menghapus chat         |
| 3  | Search chat                          | Pencarian teks di seluruh riwayat chat              |
| 4  | Syntax highlighting                  | Highlight kode di dalam respons AI                  |
| 5  | Pembersihan kode legacy              | Hapus `deepseek.js` dan referensi DeepSeek          |

### Phase 2 — Enhancement (Prioritas Menengah)

| #  | Fitur                                | Deskripsi                                           |
| -- | ------------------------------------ | --------------------------------------------------- |
| 6  | Database persistence                 | Simpan chat di database (PostgreSQL/Supabase)       |
| 7  | Multi-device sync                    | Sinkronisasi chat antar perangkat                   |
| 8  | Tavily web search integration        | AI bisa mencari informasi terkini dari internet     |
| 9  | Image upload / multimodal            | Kirim gambar untuk dianalisis AI                    |
| 10 | Multiple AI model selection          | Pilih model: LLaMA, Mixtral, Gemma, dll.            |

### Phase 3 — Scale (Prioritas Rendah)

| #  | Fitur                                | Deskripsi                                           |
| -- | ------------------------------------ | --------------------------------------------------- |
| 11 | Rate limiting server-side            | Batasi penggunaan API per user                      |
| 12 | Admin dashboard                      | Monitor penggunaan dan statistik                    |
| 13 | Tema tambahan                        | Light mode untuk chat, tema kustom                  |
| 14 | Plugin system                        | Ekstensi fitur oleh pengguna                        |
| 15 | PWA support                          | Installable sebagai app di mobile                   |

---

## 13. Keamanan

| Aspek              | Implementasi                                                      |
| ------------------ | ----------------------------------------------------------------- |
| **Autentikasi**    | GitHub OAuth via NextAuth v5 (session-based)                      |
| **Route Guard**    | Middleware melindungi semua route kecuali `/login` dan `/api/auth` |
| **API Key**        | Disimpan di server-side `.env.local`, tidak terekspos ke client    |
| **CORS**           | Dikelola oleh Next.js secara default                              |
| **XSS**            | React secara default meng-escape output                           |
| **Data Privacy**   | Chat disimpan lokal di browser, tidak dikirim ke server pihak ketiga selain Groq |

---

## 14. Glosarium

| Istilah          | Definisi                                                           |
| ---------------- | ------------------------------------------------------------------ |
| **Groq**         | Platform AI dengan LPU (Language Processing Unit) untuk inferensi ultra-cepat |
| **LLaMA**        | Large Language Model buatan Meta AI                                |
| **Streaming**    | Teknik mengirim respons secara bertahap (chunk by chunk)           |
| **System Prompt**| Instruksi awal yang menentukan perilaku/kepribadian AI             |
| **NextAuth**     | Library autentikasi untuk Next.js                                  |
| **OAuth**        | Standar autentikasi yang memungkinkan login via pihak ketiga       |
| **localStorage** | API browser untuk menyimpan data secara persisten di client-side   |
| **PM2**          | Process manager untuk Node.js (production deployment)              |

---

*Dokumen ini dibuat secara otomatis berdasarkan analisis kode sumber proyek GroqChat.*
