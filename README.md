# 🚀 GroqChat - Setup Guide

## Prerequisites

- Node.js 18+ (https://nodejs.org)
- MySQL 8.0+ (atau Docker)
- Git

## 📁 Struktur Folder

```
groqchat/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/
│   │   │   │   └── route.js
│   │   │   ├── register/
│   │   │   │   └── route.js
│   │   │   └── chat/
│   │   │       └── route.js
│   │   ├── login/
│   │   │   └── page.jsx
│   │   ├── register/
│   │   │   └── page.jsx
│   │   ├── ChatApp.jsx
│   │   ├── SystemPromptModal.jsx
│   │   ├── LogoutButton.jsx
│   │   ├── Providers.jsx
│   │   ├── layout.jsx
│   │   ├── page.jsx
│   │   ├── globals.css
│   │   └── page.module.css
│   ├── lib/
│   │   ├── prisma.js
│   │   ├── getInitials.js
│   │   ├── useCopyToClipboard.js
│   │   └── useExportChat.js
│   ├── auth.js
│   └── middleware.js
├── prisma/
│   └── schema.prisma
├── .env.example
├── .env.local (create manually)
├── .gitignore
├── next.config.js
├── tailwind.config.js
├── package.json
└── tsconfig.json
```

## 1️⃣ Setup Database MySQL

### Option A: Menggunakan Docker (Recommended)

```bash
# Jalankan MySQL container
docker run --name groqchat-mysql \
  -e MYSQL_ROOT_PASSWORD=root123 \
  -e MYSQL_DATABASE=groqchat \
  -e MYSQL_USER=groqchat_user \
  -e MYSQL_PASSWORD=strongpassword123 \
  -p 3306:3306 \
  -d mysql:8.0

# Tunggu 15 detik sampai MySQL fully started
sleep 15
```

### Option B: Instalasi Manual MySQL

```bash
# Windows - pastikan MySQL service jalan
net start MySQL80

# Buat database dan user
mysql -u root -p
```

```sql
CREATE DATABASE groqchat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'groqchat_user'@'localhost' IDENTIFIED BY 'strongpassword123';
GRANT ALL PRIVILEGES ON groqchat.* TO 'groqchat_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 2️⃣ Setup Aplikasi

### Step 1: Clone/Setup Project

```bash
# Navigate ke folder project
cd groqchat

# Copy file struktur dari outputs ke project Anda
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Setup Environment Variables

Buat file `.env.local` di root project:

```env
# Groq API
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GROQ_MODEL=llama-3.3-70b-versatile

# NextAuth Secret (generate dengan command di bawah)
AUTH_SECRET=your-random-32-char-secret

# MySQL Connection
DATABASE_URL="mysql://groqchat_user:strongpassword123@localhost:3306/groqchat"
```

**Generate AUTH_SECRET:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy hasilnya ke `.env.local`

### Step 4: Setup Database Schema

```bash
# Push Prisma schema ke MySQL
npx prisma db push

# atau gunakan migration
npx prisma migrate dev --name init
```

Output yang diharapkan:
```
✔ Your database has been created at mysql://groqchat_user:***@localhost:3306/groqchat
✔ Prisma schema has been successfully applied to your database
```

### Step 5: Verifikasi Database

```bash
# Buka Prisma Studio (UI untuk manage database)
npx prisma studio
```

Akses http://localhost:5555 untuk melihat database UI

## 3️⃣ Jalankan Aplikasi

### Development Mode

```bash
npm run dev
```

Akses http://localhost:3000

### Production Mode

```bash
npm run build
npm start
```

## 4️⃣ Test Aplikasi

1. **Buat Akun:**
   - Klik "Daftar di sini"
   - Isi nama, email, password
   - Klik "Daftar"

2. **Login:**
   - Email: (akun yang baru dibuat)
   - Password: (password yang didaftarkan)
   - Klik "Masuk"

3. **Test Chat:**
   - Ketik pertanyaan
   - Tekan Enter atau klik tombol kirim
   - Tunggu respons dari Groq API

4. **Test Fitur:**
   - Klik system prompt untuk customize
   - Export chat ke berbagai format
   - Copy pesan ke clipboard
   - Logout

## 🔑 Mendapatkan GROQ_API_KEY

1. Buka https://console.groq.com
2. Login atau buat akun
3. Navigasi ke "API Keys"
4. Generate new API key
5. Copy key dan paste ke `.env.local`

## 🐛 Troubleshooting

### Error: "Can't reach database server"

```bash
# Pastikan MySQL service jalan
# Windows:
net start MySQL80

# Linux:
sudo systemctl start mysql

# Docker:
docker start groqchat-mysql
```

### Error: "mysql: command not found"

Tidak perlu install mysql CLI untuk dev. Gunakan Prisma Studio:
```bash
npx prisma studio
```

### Error: "GROQ_API_KEY not found"

Pastikan `.env.local` berisi:
```env
GROQ_API_KEY=gsk_xxxxxxxxxxxx
```

### Error: "NextAuth secret not set"

Generate secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Paste ke `.env.local`:
```env
AUTH_SECRET=<paste_hasil_di_sini>
```

## 📊 Database Management

```bash
# View database (UI)
npx prisma studio

# Push schema changes
npx prisma db push

# Create migration
npx prisma migrate dev --name <description>

# Reset database (WARNING: hapus semua data)
npx prisma migrate reset
```

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Push ke GitHub
git push origin main

# Connect di Vercel dashboard
# Set environment variables di Vercel
# Deploy
```

### Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up
```

### Self-Hosted (VPS)

```bash
# Build production
npm run build

# Start dengan PM2
npm install -g pm2
pm2 start "npm start" --name "groqchat"
```

## 📝 Notes

- Chat history disimpan di localStorage (client-side)
- User account disimpan di MySQL (server-side)
- API key Groq hanya digunakan di server
- Password di-hash dengan bcryptjs sebelum disimpan

## 💬 Support

Untuk pertanyaan atau issue:
- Check documentation: https://docs.anthropic.com
- Check Groq docs: https://console.groq.com/docs
- Check Next.js docs: https://nextjs.org/docs