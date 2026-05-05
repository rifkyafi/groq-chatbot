import OpenAI from "openai";

export async function POST(request) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return Response.json(
        { error: "Format messages tidak valid." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "GROQ_API_KEY belum dikonfigurasi di .env.local" },
        { status: 500 }
      );
    }

    const groq = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://api.groq.com/openai/v1",
    });

    const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

    const completion = await groq.chat.completions.create({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 2048,
      stream: true,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              // Kirim sebagai raw text, bukan SSE format
              controller.enqueue(encoder.encode(content));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Groq API Error:", error);

    const message =
      error?.status === 401
        ? "API key tidak valid. Periksa GROQ_API_KEY di .env.local"
        : error?.status === 429
        ? "Rate limit tercapai. Tunggu sebentar lalu coba lagi."
        : error?.message || "Terjadi kesalahan pada server.";

    return Response.json({ error: message }, { status: error?.status || 500 });
  }
}