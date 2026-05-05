# ◆ DeepSeek Chatbot — Next.js Template

Template chatbot modern menggunakan Next.js 14 + DeepSeek API dengan fitur streaming.

---

## 🚀 Instalasi & Setup

### 1. Clone / Salin Proyek

```bash
# Jika dari Git
git clone <repo-url>
cd deepseek-chatbot

# Atau buat folder baru dan salin semua file
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup API Key DeepSeek

Buat file `.env.local` di root folder proyek:

```bash
# Copy dari template
cp .env.example .env.local
```

Lalu buka `.env.local` dan isi API key Anda:

```env
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
DEEPSEEK_MODEL=deepseek-chat
```

> **Cara mendapatkan API Key:**
> 1. Buka https://platform.deepseek.com
> 2. Daftar / login
> 3. Buka menu **API Keys**
> 4. Klik **Create new secret key**
> 5. Salin key dan paste ke `.env.local`

### 4. Jalankan Development Server

```bash
npm run dev
```

Buka browser ke: **http://localhost:3000**

---

## 📁 Struktur Proyek

```
deepseek-chatbot/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── chat/
│   │   │       └── route.js      ← API endpoint (server-side)
│   │   ├── globals.css           ← Style global
│   │   ├── layout.jsx            ← Root layout
│   │   ├── page.jsx              ← Halaman chat utama
│   │   └── page.module.css       ← CSS module untuk halaman
│   └── lib/
│       └── deepseek.js           ← DeepSeek client
├── .env.local                    ← API key (JANGAN di-commit!)
├── .env.example                  ← Template env
├── next.config.js
└── package.json
```

---

## 🛠️ Perintah

| Perintah        | Keterangan                          |
|-----------------|-------------------------------------|
| `npm run dev`   | Jalankan development server         |
| `npm run build` | Build untuk production              |
| `npm start`     | Jalankan production server          |

---

## ✨ Fitur

- ✅ Streaming response (teks muncul bertahap)
- ✅ Riwayat percakapan (multi-turn)
- ✅ Kirim dengan Enter, baris baru dengan Shift+Enter
- ✅ Indikator loading & typing
- ✅ Pesan error yang informatif
- ✅ Tombol clear chat
- ✅ Suggestion prompts
- ✅ Responsive (mobile-friendly)

---

## 🔧 Kustomisasi

### Ganti System Prompt
Edit bagian `SYSTEM_PROMPT` di `src/app/page.jsx`:

```js
const SYSTEM_PROMPT = {
  role: "system",
  content: "Kamu adalah... (isi sesuai kebutuhan)",
};
```

### Ganti Model
Di `.env.local`:
```env
DEEPSEEK_MODEL=deepseek-reasoner   # untuk model reasoning
```

### Ganti Temperatur / Max Tokens
Di `src/app/api/chat/route.js`:
```js
const completion = await deepseek.chat.completions.create({
  temperature: 0.7,   // 0 = deterministik, 1 = kreatif
  max_tokens: 2048,
  ...
});
```
