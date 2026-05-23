// src/app/api/register/route.js
import { NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import pool from "@/lib/db";

export async function POST(req) {
  try {
    const { name, email, password, confirmPassword } = await req.json();

    // Validasi input
    if (!name || !email || !password || !confirmPassword) {
      return NextResponse.json(
        { error: "Semua field harus diisi." },
        { status: 400 },
      );
    }

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Format email tidak valid." },
        { status: 400 },
      );
    }

    // Validasi panjang nama
    if (name.trim().length < 2) {
      return NextResponse.json(
        { error: "Nama minimal 2 karakter." },
        { status: 400 },
      );
    }

    // Validasi panjang password
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password minimal 8 karakter." },
        { status: 400 },
      );
    }

    // Validasi kecocokan password
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Konfirmasi password tidak cocok." },
        { status: 400 },
      );
    }

    // Cek email sudah terdaftar
    const [existingRows] = await pool.execute(
      "SELECT id FROM users WHERE email = ?",
      [email.toLowerCase()],
    );
    const existingUser = existingRows[0];

    if (existingUser) {
      return NextResponse.json(
        { error: "Email sudah terdaftar." },
        { status: 409 },
      );
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 12);

    // Create user (set timestamps explicitly to avoid missing-default errors)
    const [result] = await pool.execute(
      "INSERT INTO users (name, email, password, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())",
      [name.trim(), email.toLowerCase(), hashedPassword],
    );

    return NextResponse.json(
      {
        message: "Akun berhasil dibuat. Silakan login.",
        user: {
          id: result.insertId.toString(),
          name: name.trim(),
          email: email.toLowerCase(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server. Coba lagi nanti." },
      { status: 500 },
    );
  }
}
