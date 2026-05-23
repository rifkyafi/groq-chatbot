# 📋 Product Requirements Document (PRD)

## GroqChat — AI Chatbot berbasis Groq

| Field              | Detail                                                 |
| ------------------ | ------------------------------------------------------ |
| **Nama Produk**    | GroqChat                                               |
| **Versi**          | 0.2.0                                                  |
| **Tanggal**        | 23 Mei 2026                                            |
| **Status**         | MVP — Aktif digunakan                                  |
| **Tech Stack**     | Next.js 16 · React 19 · Groq API · NextAuth v5 · MySQL |
| **Model AI**       | LLaMA 3.3 70B Versatile (via Groq)                     |
| **Target Audiens** | Pengguna umum berbahasa Indonesia                      |

> **Changelog v0.2.0:** Sistem autentikasi dimigrasi dari **GitHub OAuth** ke **registrasi/login mandiri berbasis MySQL**. Data akun pengguna kini disimpan di database MySQL server-side, bukan bergantung pada pihak ketiga (GitHub).

---

## 1. Ringkasan Produk

**GroqChat** adalah aplikasi chatbot web berbasis AI yang memanfaatkan **Groq API** (LLaMA 3.3 70B) untuk memberikan respons percakapan secara **real-time streaming**. Aplikasi ini dibangun dengan Next.js 16 dan React 19, menggunakan dark-themed UI yang modern, serta dilengkapi sistem autentikasi mandiri (email + password) yang menyimpan data akun di **MySQL**.

### Unique Value Proposition

- ⚡ **Ultra-fast inference** — Groq LPU menyediakan kecepatan inferensi jauh lebih cepat dari GPU tradisional
- 🆓 **Gratis selamanya** — Menggunakan free tier Groq API tanpa biaya
- 🇮🇩 **Dioptimalkan untuk bahasa Indonesia** — System prompt dan UI dalam bahasa Indonesia
- 🔒 **Akun mandiri** — Registrasi & login dengan email/password, tidak perlu akun GitHub
- 💾 **Data tersinkronisasi** — Riwayat chat disimpan di MySQL, bisa diakses dari perangkat manapun

---

## 2. Tujuan & Sasaran

### Tujuan Bisnis

- Menyediakan chatbot AI gratis yang mudah diakses untuk pengguna Indonesia tanpa ketergantungan pada OAuth pihak ketiga
- Memungkinkan pengguna tanpa akun GitHub untuk tetap bisa menggunakan layanan

### Tujuan Teknis

- Membangun arsitektur streaming yang efisien untuk pengalaman chat real-time
- Implementasi autentikasi email/password yang aman dengan NextAuth v5 + MySQL
- Menyimpan data akun dan (opsional) riwayat chat di MySQL untuk persistensi multi-device

### Metrik Keberhasilan

- Waktu respons pertama (TTFB) < 500ms
- Chat streaming tanpa buffering terlihat
- Halaman registrasi/login → chat dalam < 3 langkah
- Query database autentikasi < 100ms

---

## 3. Arsitektur Sistem

### 3.1 Diagram Arsitektur

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENT (Browser)                   │
│                                                         │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  Login Page  │  │   ChatApp    │  │  localStorage │  │
│  │  Register    │→ │  (Main UI)   │↔ │  - chats      │  │
│  │  (Email/Pass)│  │              │  │  - systemPrompt│  │
│  └─────────────┘  │  ┌──────────┐│  │  - suggestions │  │
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
│  │  - Validasi     │    │  - Credentials Provider │      │
│  │  - Streaming    │    │  - bcrypt verify        │      │
│  └────────┬────────┘    └────────────┬───────────┘       │
│           │                          │                   │
│  ┌────────┴────────┐    ┌────────────┴───────────┐       │
│  │  Middleware      │    │  /api/register         │       │
│  │  - Auth guard    │    │  - Validasi input      │       │
│  │  - Route protect │    │  - Hash password       │       │
│  └─────────────────┘    │  - Insert ke MySQL      │       │
│                         └────────────┬───────────┘       │
└──────────────────────────────────────┼───────────────────┘
                                       │ mysql2 / prisma
                                       ▼
                          ┌────────────────────────┐
                          │   MySQL Database        │
                          │   - tabel: users        │
                          │   - id, name, email,    │
                          │     password (bcrypt),  │
                          │     created_at          │
                          └────────────────────────┘
                                       ·
                                       · (terpisah)
                                       ▼
                          ┌────────────────────────┐
                          │   Groq Cloud API        │
                          │   api.groq.com          │
                          │   Model: llama-3.3-70b  │
                          └────────────────────────┘
```

### 3.2 Struktur File

```
groq-chatbot/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/     ← NextAuth route handlers
│   │   │   ├── register/route.js       ← ✨ BARU: Endpoint registrasi akun
│   │   │   └── chat/route.js           ← API endpoint streaming chat
│   │   ├── login/page.jsx              ← Halaman login (email/password form)
│   │   ├── register/page.jsx           ← ✨ BARU: Halaman registrasi akun
│   │   ├── ChatApp.jsx                 ← Komponen utama chat (863 baris)
│   │   ├── SystemPromptModal.jsx       ← Modal konfigurasi system prompt
│   │   ├── LogoutButton.jsx            ← Tombol logout
│   │   ├── Providers.jsx               ← SessionProvider wrapper
│   │   ├── page.jsx                    ← Entry point (dynamic import)
│   │   ├── layout.jsx                  ← Root layout + metadata
│   │   ├── globals.css                 ← Global styles
│   │   └── page.module.css             ← CSS module halaman chat
│   ├── lib/
│   │   ├── db.js                       ← ✨ BARU: Koneksi MySQL (mysql2/promise)
│   │   ├── useCopyToClipboard.js       ← Hook: copy pesan ke clipboard
│   │   └── useExportChat.js            ← Hook: export chat ke file
│   ├── auth.js                         ← ✨ DIUBAH: NextAuth + Credentials Provider
│   └── middleware.js                   ← Auth middleware (route protection)
├── prisma/                             ← ✨ OPSIONAL: Prisma ORM
│   └── schema.prisma                   ← Schema database MySQL
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

| Package          | Versi     | Fungsi                                 |
| ---------------- | --------- | -------------------------------------- |
| `next`           | ^16.2.4   | Framework React full-stack             |
| `react`          | ^19.2.5   | UI library                             |
| `react-dom`      | ^19.2.5   | React DOM renderer                     |
| `next-auth`      | ^5.0.0β31 | Autentikasi (Credentials Provider)     |
| `openai`         | ^4.104.0  | Client SDK untuk Groq API (kompatibel) |
| `mysql2`         | ^3.x.x    | ✨ BARU: MySQL driver untuk Node.js    |
| `bcryptjs`       | ^2.x.x    | ✨ BARU: Hash & verifikasi password    |
| `@prisma/client` | ^5.x.x    | ✨ OPSIONAL: Prisma ORM client         |
| `@tavily/core`   | ^0.7.3    | (Tersedia, belum digunakan aktif)      |

> ⚠️ **Dihapus:** Tidak lagi membutuhkan konfigurasi `GITHUB_ID` / `GITHUB_SECRET` karena autentikasi tidak lagi melalui GitHub OAuth.

### 4.2 Dev Dependencies

| Package              | Versi   | Fungsi                               |
| -------------------- | ------- | ------------------------------------ |
| `tailwindcss`        | ^3.4.19 | Utility-first CSS                    |
| `postcss`            | ^8.5.13 | CSS processor                        |
| `autoprefixer`       | ^10.5.0 | CSS auto-prefixing                   |
| `eslint`             | ^10.3.0 | Linter                               |
| `eslint-config-next` | ^16.2.4 | ESLint Next.js rules                 |
| `prisma`             | ^5.x.x  | ✨ OPSIONAL: Prisma CLI & migrations |

### 4.3 External Services

| Service          | Kegunaan                     | Endpoint / Keterangan            |
| ---------------- | ---------------------------- | -------------------------------- |
| **Groq API**     | LLM inference (streaming)    | `https://api.groq.com/openai/v1` |
| ~~GitHub OAuth~~ | ~~Autentikasi pengguna~~     | **❌ Dihapus**                   |
| **MySQL**        | ✨ Penyimpanan akun pengguna | Server lokal / cloud MySQL       |
| **Google Fonts** | Font Sora & JetBrains Mono   | CDN                              |

---

## 5. Skema Database MySQL

### 5.1 Tabel `users`

```sql
CREATE TABLE users (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100)        NOT NULL,
  email      VARCHAR(255) UNIQUE NOT NULL,
  password   VARCHAR(255)        NOT NULL,  -- bcrypt hash
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
);
```

### 5.2 Prisma Schema (Opsional)

```prisma
// prisma/schema.prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        Int      @id @default(autoincrement()) @db.UnsignedInt
  name      String   @db.VarChar(100)
  email     String   @unique @db.VarChar(255)
  password  String   @db.VarChar(255)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("users")
}
```

---

## 6. Fitur Produk

### 6.1 Autentikasi & Keamanan

| ID    | Fitur                         | Status     | Deskripsi                                                                            |
| ----- | ----------------------------- | ---------- | ------------------------------------------------------------------------------------ |
| AU-01 | ~~Login via GitHub OAuth~~    | ❌ Dihapus | Diganti dengan sistem login email/password                                           |
| AU-01 | Login via Email & Password    | ✅ Done    | ✨ Form login dengan validasi email + password, autentikasi via Credentials Provider |
| AU-02 | Registrasi akun baru          | ✅ Done    | ✨ Halaman `/register` dengan form nama, email, password, konfirmasi password        |
| AU-03 | Hash password (bcrypt)        | ✅ Done    | ✨ Password di-hash dengan bcryptjs sebelum disimpan ke MySQL                        |
| AU-04 | Session management            | ✅ Done    | Session token dikelola otomatis oleh NextAuth                                        |
| AU-05 | Route protection (middleware) | ✅ Done    | Semua halaman kecuali `/login`, `/register`, dan `/api/auth/*` dilindungi middleware |
| AU-06 | Redirect ke login             | ✅ Done    | User yang belum login otomatis diarahkan ke `/login?callbackUrl=/`                   |
| AU-07 | Logout                        | ✅ Done    | Tombol logout di user menu, redirect ke halaman login                                |
| AU-08 | User profile display          | ✅ Done    | Menampilkan nama dan email pengguna dari database di topbar                          |
| AU-09 | Validasi email unik           | ✅ Done    | ✨ Tidak bisa registrasi dengan email yang sudah terdaftar                           |
| AU-10 | Password strength validation  | ✅ Done    | ✨ Minimum 8 karakter, feedback realtime di form registrasi                          |

### 6.2 Chat Core

| ID    | Fitur                         | Status  | Deskripsi                                                                |
| ----- | ----------------------------- | ------- | ------------------------------------------------------------------------ |
| CH-01 | Streaming response            | ✅ Done | Teks muncul bertahap via ReadableStream — pengalaman real-time           |
| CH-02 | Multi-turn conversation       | ✅ Done | Riwayat pesan dikirim bersama setiap request untuk konteks percakapan    |
| CH-03 | Multiple chat sessions        | ✅ Done | User dapat membuat dan mengelola banyak sesi chat secara bersamaan       |
| CH-04 | Auto-title dari pesan pertama | ✅ Done | Judul chat otomatis diambil dari 40 karakter pertama pesan user          |
| CH-05 | Typing indicator              | ✅ Done | Animasi 3 titik berkedip saat menunggu respons AI                        |
| CH-06 | Loading state                 | ✅ Done | Tombol kirim berubah menjadi ⏳ saat proses berlangsung                  |
| CH-07 | Error handling                | ✅ Done | Pesan error ditampilkan inline (HTTP error, rate limit, API key invalid) |
| CH-08 | Regenerate response           | ✅ Done | Tombol 🔄 Regenerate untuk meminta ulang jawaban terakhir AI             |
| CH-09 | Keyboard shortcuts            | ✅ Done | Enter = kirim, Shift+Enter = baris baru                                  |

### 6.3 Manajemen Chat

| ID    | Fitur                   | Status  | Deskripsi                                                                |
| ----- | ----------------------- | ------- | ------------------------------------------------------------------------ |
| MG-01 | Sidebar chat list       | ✅ Done | Sidebar collapsible menampilkan daftar semua chat                        |
| MG-02 | Grouped by date         | ✅ Done | Chat dikelompokkan: Hari ini, Kemarin, Minggu ini, atau tanggal spesifik |
| MG-03 | Create new chat         | ✅ Done | Tombol ✏️ Chat Baru di sidebar                                           |
| MG-04 | Rename chat             | ✅ Done | Inline editing judul chat di sidebar (hover → klik ✏️)                   |
| MG-05 | Delete chat             | ✅ Done | Tombol hapus 🗑️ muncul saat hover di sidebar                             |
| MG-06 | Persist ke localStorage | ✅ Done | Semua data chat disimpan di browser, bertahan setelah refresh            |
| MG-07 | Toggle sidebar          | ✅ Done | Tombol ◀/▶ di topbar untuk show/hide sidebar dengan animasi smooth       |

### 6.4 Suggestion Prompts

| ID    | Fitur               | Status  | Deskripsi                                                          |
| ----- | ------------------- | ------- | ------------------------------------------------------------------ |
| SG-01 | Dynamic suggestions | ✅ Done | 4 topik trending Indonesia dihasilkan AI secara dinamis saat load  |
| SG-02 | Skeleton loading    | ✅ Done | Skeleton card dengan animasi shimmer saat suggestions loading      |
| SG-03 | One-click start     | ✅ Done | Klik suggestion langsung buat chat baru + kirim pertanyaan         |
| SG-04 | Cache suggestions   | ✅ Done | Suggestions disimpan di localStorage agar tidak reload setiap sesi |

### 6.5 System Prompt (Kustomisasi AI)

| ID    | Fitur                   | Status  | Deskripsi                                                   |
| ----- | ----------------------- | ------- | ----------------------------------------------------------- |
| SP-01 | Custom system prompt    | ✅ Done | User dapat menulis system prompt sendiri via modal          |
| SP-02 | Preset cepat            | ✅ Done | 5 preset: Default, Guru, Senior Dev, Penulis, Analis        |
| SP-03 | Persist system prompt   | ✅ Done | System prompt disimpan di localStorage, bertahan antar sesi |
| SP-04 | Character counter       | ✅ Done | Menampilkan jumlah karakter system prompt secara real-time  |
| SP-05 | Visual indicator        | ✅ Done | Dot indicator di sidebar jika system prompt bukan default   |
| SP-06 | Save confirmation badge | ✅ Done | Badge "✓ System prompt tersimpan" muncul 3 detik di topbar  |

### 6.6 Export & Utilitas

| ID    | Fitur                       | Status  | Deskripsi                                                       |
| ----- | --------------------------- | ------- | --------------------------------------------------------------- |
| EX-01 | Export ke Markdown (.md)    | ✅ Done | Format heading + blockquote, cocok untuk Notion/Obsidian        |
| EX-02 | Export ke Plain Text (.txt) | ✅ Done | Format sederhana dengan timestamp per pesan                     |
| EX-03 | Export ke JSON (.json)      | ✅ Done | Format mentah dengan pretty-print, untuk backup/developer       |
| EX-04 | Copy pesan ke clipboard     | ✅ Done | Tombol "⎘ Copy" muncul saat hover di setiap bubble pesan        |
| EX-05 | Copy confirmation           | ✅ Done | Tombol berubah menjadi "✓ Tersalin" selama 2 detik setelah copy |

### 6.7 UI/UX

| ID    | Fitur                          | Status     | Deskripsi                                                       |
| ----- | ------------------------------ | ---------- | --------------------------------------------------------------- |
| UX-01 | Dark theme                     | ✅ Done    | Tema gelap premium dengan warna violet accent                   |
| UX-02 | Responsive layout              | ✅ Done    | Mobile-friendly dengan sidebar collapsible                      |
| UX-03 | Smooth animations              | ✅ Done    | Animasi: shimmer, blink, msgIn, dropIn, slideIn, modalIn        |
| UX-04 | Auto-scroll ke pesan terbaru   | ✅ Done    | Scroll otomatis ke bawah setiap ada pesan baru                  |
| UX-05 | Auto-resize textarea           | ✅ Done    | Textarea input otomatis membesar sesuai isi (max 160px)         |
| UX-06 | Custom scrollbar               | ✅ Done    | Thin scrollbar yang konsisten dengan dark theme                 |
| UX-07 | Typography: Sora + JetBrains   | ✅ Done    | Font Sora untuk teks umum, JetBrains Mono untuk monospace       |
| UX-08 | ~~User avatar dari GitHub~~    | ❌ Dihapus | Diganti dengan avatar inisial dari nama pengguna                |
| UX-08 | User avatar (inisial nama)     | ✅ Done    | ✨ Avatar berisi inisial nama yang diambil dari database MySQL  |
| UX-09 | Light/Dark toggle (login page) | ✅ Done    | Toggle tema terang/gelap tersedia di halaman login & registrasi |

---

## 7. Alur Data (Data Flow)

### 7.1 Alur Registrasi

```
User → Buka /register
  → Isi form: nama, email, password, konfirmasi password
    → Klik "Daftar"
      → POST /api/register
        → Validasi input (field kosong, format email, password match)
        → Cek email duplikat di MySQL
          → Email sudah ada → Return 409 Conflict
        → Hash password dengan bcryptjs (salt rounds: 12)
        → INSERT INTO users (name, email, password) VALUES (...)
        → Return 201 Created
      → Redirect ke /login
        → User login dengan email/password yang baru didaftarkan
```

### 7.2 Alur Autentikasi (Login)

```
User → Buka /login
  → Isi email & password
    → Klik "Masuk"
      → NextAuth signIn('credentials', { email, password })
        → Credentials Provider authorize()
          → SELECT * FROM users WHERE email = ?
            → User tidak ditemukan → Return null (unauthorized)
          → bcrypt.compare(inputPassword, hashedPassword)
            → Tidak cocok → Return null (unauthorized)
          → Return user object { id, name, email }
        → NextAuth buat session JWT
      → Middleware cek session
      → Redirect ke / (ChatApp)
```

### 7.3 Alur Kirim Pesan

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

### 7.4 Alur Suggestion

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

## 8. Catatan Database & Deployment

- **Timestamp requirement:** Beberapa environment MySQL mungkin tidak menyediakan nilai default untuk kolom `updated_at`. Jika kolom `updated_at` tidak memiliki default, INSERT tanpa menyertakan nilai akan gagal (ER_NO_DEFAULT_FOR_FIELD). Backend saat ini meng-set `created_at` dan `updated_at` secara eksplisit pada endpoint registrasi, tetapi disarankan menambahkan default di level database untuk ketahanan produksi.

- **Rekomendasi migrasi (MySQL):** jalankan di client DB Anda untuk memastikan `updated_at` selalu tersedia dan otomatis ter-update:

```sql
ALTER TABLE users
  MODIFY COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
```

- **Alternatif:** biarkan backend menetapkan timestamp pada INSERT/UPDATE (mis. `NOW()`), namun menambahkan default DB mencegah error saat ada query lain yang lupa menyertakan timestamp.

- **Catatan deployment:** pastikan `DATABASE_URL` di environment (production) mengarah ke instance MySQL yang sudah memiliki migrasi/struktur di bagian **5. Skema Database MySQL**. Jika menggunakan Prisma, pertimbangkan membuat migration yang meng-encode `created_at`/`updated_at` defaults.

## 8. API Specification

### 8.1 POST `/api/register` ✨ BARU

**Request:**

```json
{
  "name": "Budi Santoso",
  "email": "budi@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

**Response Sukses (201):**

```json
{
  "message": "Akun berhasil dibuat. Silakan login."
}
```

**Response Error:**

```json
{ "error": "Email sudah terdaftar." }
{ "error": "Semua field harus diisi." }
{ "error": "Format email tidak valid." }
{ "error": "Password minimal 8 karakter." }
{ "error": "Konfirmasi password tidak cocok." }
```

**Status Codes:**

| Code | Kondisi                            |
| ---- | ---------------------------------- |
| 201  | Akun berhasil dibuat               |
| 400  | Validasi gagal (field tidak valid) |
| 409  | Email sudah digunakan              |
| 500  | Server / database error            |

### 8.2 POST `/api/chat`

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

### 8.3 API Parameters (Groq)

| Parameter     | Nilai                     | Keterangan                  |
| ------------- | ------------------------- | --------------------------- |
| `model`       | `llama-3.3-70b-versatile` | Dari env `GROQ_MODEL`       |
| `temperature` | `0.7`                     | Balance kreativitas/akurasi |
| `max_tokens`  | `2048`                    | Batas token per respons     |
| `stream`      | `true`                    | Aktifkan streaming          |

---

## 9. Environment Variables

| Variable            | Required | Deskripsi                          | Contoh                                      |
| ------------------- | -------- | ---------------------------------- | ------------------------------------------- |
| `GROQ_API_KEY`      | ✅       | API key dari platform.groq.com     | `gsk_xxxxxxxxxxxxx`                         |
| `GROQ_MODEL`        | ❌       | Model AI (default: llama-3.3-70b)  | `llama-3.3-70b-versatile`                   |
| ~~`GITHUB_ID`~~     | ❌       | ~~GitHub OAuth App Client ID~~     | **Dihapus**                                 |
| ~~`GITHUB_SECRET`~~ | ❌       | ~~GitHub OAuth App Client Secret~~ | **Dihapus**                                 |
| `DATABASE_URL`      | ✅       | ✨ Koneksi string MySQL            | `mysql://user:pass@localhost:3306/groqchat` |
| `DB_HOST`           | ✅       | ✨ Host MySQL                      | `localhost`                                 |
| `DB_PORT`           | ❌       | ✨ Port MySQL (default: 3306)      | `3306`                                      |
| `DB_USER`           | ✅       | ✨ Username MySQL                  | `groqchat_user`                             |
| `DB_PASSWORD`       | ✅       | ✨ Password MySQL                  | `strongpassword`                            |
| `DB_NAME`           | ✅       | ✨ Nama database MySQL             | `groqchat`                                  |
| `AUTH_SECRET`       | ✅       | NextAuth secret key                | `random-string-32-chars`                    |

---

## 10. Deployment

### 10.1 Development

```bash
# 1. Install dependencies
npm install

# 2. Setup database MySQL (sekali saja)
mysql -u root -p < prisma/migrations/init.sql
# atau dengan Prisma:
npx prisma migrate dev

# 3. Jalankan dev server
npm run dev          # localhost:3000
```

### 10.2 Production

```bash
npm run build        # Build production bundle
npm start            # Jalankan production server
```

### 10.3 PM2 (Production Process Manager)

Konfigurasi PM2 tersedia di `ecosystem.config.js`:

- **Mode:** Cluster (multi-instance, semua CPU core)
- **Memory limit:** 500MB per instance (auto-restart)
- **Logging:** `./logs/out.log` dan `./logs/error.log`
- **Port:** 3000

### 10.4 Setup MySQL (Sekali Saja)

```sql
-- Buat database dan user
CREATE DATABASE groqchat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'groqchat_user'@'localhost' IDENTIFIED BY 'strongpassword';
GRANT ALL PRIVILEGES ON groqchat.* TO 'groqchat_user'@'localhost';
FLUSH PRIVILEGES;

-- Buat tabel users
USE groqchat;
CREATE TABLE users (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100)        NOT NULL,
  email      VARCHAR(255) UNIQUE NOT NULL,
  password   VARCHAR(255)        NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
);
```

---

## 11. Penyimpanan Data

| Data              | Lokasi            | Persistence         | Keterangan                                        |
| ----------------- | ----------------- | ------------------- | ------------------------------------------------- |
| **Akun pengguna** | **MySQL**         | **Server-side**     | ✨ id, nama, email, password (bcrypt), created_at |
| Chat messages     | `localStorage`    | Per browser/device  | Key: `chats`                                      |
| System prompt     | `localStorage`    | Per browser/device  | Key: `systemPrompt`                               |
| Suggestions       | `localStorage`    | Per browser/device  | Key: `suggestions`                                |
| Auth session      | Cookie (httpOnly) | Managed by NextAuth | Otomatis expire sesuai konfigurasi                |
| Theme preference  | `localStorage`    | Per browser/device  | Key: `theme` (untuk halaman login)                |

> ⚠️ **Catatan:** Data chat masih tersimpan secara lokal di browser (localStorage). Hanya data **akun pengguna** yang kini disimpan di MySQL. Jika pengguna menghapus data browser, riwayat chat akan hilang (lihat Roadmap untuk migrasi chat ke database).

---

## 12. Keterbatasan Saat Ini

| #   | Keterbatasan                                      | Dampak                                                |
| --- | ------------------------------------------------- | ----------------------------------------------------- |
| 1   | Riwayat chat masih di localStorage                | Data hilang jika browser dibersihkan                  |
| 2   | Tidak ada sinkronisasi chat antar device          | Chat di HP tidak muncul di laptop                     |
| 3   | Tidak ada markdown rendering di chat bubble       | Kode dan formatting AI ditampilkan sebagai teks biasa |
| 4   | Tidak ada rate limiting di sisi server            | Potensi abuse jika API key bocor                      |
| 5   | Tidak ada search/filter chat                      | Sulit menemukan chat lama jika banyak                 |
| 6   | Belum ada konfirmasi hapus chat                   | Chat bisa terhapus tanpa sengaja                      |
| 7   | `@tavily/core` tersedia tapi belum diintegrasikan | Fitur web search belum aktif                          |
| 8   | Modul `deepseek.js` di-comment-out                | Kode legacy yang tidak terpakai                       |
| 9   | Belum ada fitur lupa password / reset password    | User tidak bisa recover akun jika lupa password       |
| 10  | Tidak ada verifikasi email saat registrasi        | Akun bisa dibuat dengan email palsu                   |

---

## 13. Roadmap (Rencana Pengembangan)

### Phase 1 — Polish (Prioritas Tinggi)

| #   | Fitur                    | Deskripsi                                      |
| --- | ------------------------ | ---------------------------------------------- |
| 1   | Markdown rendering       | Render kode, tabel, bold/italic di chat bubble |
| 2   | Konfirmasi hapus chat    | Dialog "Yakin hapus?" sebelum menghapus chat   |
| 3   | Search chat              | Pencarian teks di seluruh riwayat chat         |
| 4   | Syntax highlighting      | Highlight kode di dalam respons AI             |
| 5   | Pembersihan kode legacy  | Hapus `deepseek.js` dan referensi DeepSeek     |
| 6   | Reset password via email | Kirim link reset password ke email terdaftar   |

### Phase 2 — Enhancement (Prioritas Menengah)

| #   | Fitur                            | Deskripsi                                           |
| --- | -------------------------------- | --------------------------------------------------- |
| 7   | Simpan chat ke MySQL             | Migrasi penyimpanan chat dari localStorage ke MySQL |
| 8   | Multi-device sync                | Sinkronisasi chat antar perangkat via database      |
| 9   | Verifikasi email saat registrasi | Kirim email konfirmasi setelah daftar               |
| 10  | Tavily web search integration    | AI bisa mencari informasi terkini dari internet     |
| 11  | Image upload / multimodal        | Kirim gambar untuk dianalisis AI                    |
| 12  | Multiple AI model selection      | Pilih model: LLaMA, Mixtral, Gemma, dll.            |

### Phase 3 — Scale (Prioritas Rendah)

| #   | Fitur                     | Deskripsi                          |
| --- | ------------------------- | ---------------------------------- |
| 13  | Rate limiting server-side | Batasi penggunaan API per user     |
| 14  | Admin dashboard           | Monitor penggunaan dan statistik   |
| 15  | Tema tambahan             | Light mode untuk chat, tema kustom |
| 16  | Plugin system             | Ekstensi fitur oleh pengguna       |
| 17  | PWA support               | Installable sebagai app di mobile  |

---

## 14. Keamanan

| Aspek             | Implementasi                                                                     |
| ----------------- | -------------------------------------------------------------------------------- |
| **Autentikasi**   | ✨ Email/password via NextAuth v5 Credentials Provider                           |
| **Password**      | ✨ Di-hash dengan bcryptjs (salt rounds: 12) sebelum disimpan ke MySQL           |
| **Route Guard**   | Middleware melindungi semua route kecuali `/login`, `/register`, `/api/auth`     |
| **API Key Groq**  | Disimpan di server-side `.env.local`, tidak terekspos ke client                  |
| **SQL Injection** | ✨ Menggunakan parameterized query (mysql2) atau Prisma ORM                      |
| **CORS**          | Dikelola oleh Next.js secara default                                             |
| **XSS**           | React secara default meng-escape output                                          |
| **Data Privacy**  | Chat disimpan lokal di browser, tidak dikirim ke server pihak ketiga selain Groq |

---

## 15. Glosarium

| Istilah                  | Definisi                                                                      |
| ------------------------ | ----------------------------------------------------------------------------- |
| **Groq**                 | Platform AI dengan LPU (Language Processing Unit) untuk inferensi ultra-cepat |
| **LLaMA**                | Large Language Model buatan Meta AI                                           |
| **Streaming**            | Teknik mengirim respons secara bertahap (chunk by chunk)                      |
| **System Prompt**        | Instruksi awal yang menentukan perilaku/kepribadian AI                        |
| **NextAuth**             | Library autentikasi untuk Next.js                                             |
| **Credentials Provider** | NextAuth provider untuk login dengan username/password custom                 |
| **bcrypt**               | Algoritma hashing satu arah yang aman untuk menyimpan password                |
| **mysql2**               | Driver MySQL untuk Node.js dengan dukungan Promise dan prepared statements    |
| **Prisma**               | ORM modern untuk Node.js/TypeScript yang mendukung MySQL                      |
| **localStorage**         | API browser untuk menyimpan data secara persisten di client-side              |
| **PM2**                  | Process manager untuk Node.js (production deployment)                         |
| ~~**OAuth**~~            | ~~Standar autentikasi via pihak ketiga~~ — tidak lagi digunakan               |

---

_Dokumen ini diperbarui pada 23 Mei 2026 — migrasi autentikasi dari GitHub OAuth ke MySQL (v0.1.0 → v0.2.0)._
