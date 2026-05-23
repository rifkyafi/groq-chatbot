// src/app/api/chat/route.js
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import Groq from "openai";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export async function POST(req) {
  try {
    // Cek autentikasi
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messages } = await req.json();

    // Validasi messages
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Invalid messages format" },
        { status: 400 }
      );
    }

    // Validasi API key
    if (!process.env.GROQ_API_KEY) {
      console.error("GROQ_API_KEY not set");
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    // Create streaming response
    const stream = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: 0.7,
      max_tokens: 2048,
      stream: true,
    });

    // Stream response ke client
    const encoder = new TextEncoder();
    const customReadable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content || "";
            if (delta) {
              controller.enqueue(encoder.encode(delta));
            }
          }
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        }
      },
    });

    return new NextResponse(customReadable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);

    if (error.status === 429) {
      return NextResponse.json(
        { error: "Rate limit tercapai. Tunggu sebentar lalu coba lagi." },
        { status: 429 }
      );
    }

    if (error.status === 401) {
      return NextResponse.json(
        { error: "API key tidak valid atau sudah expired." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}