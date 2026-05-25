import { useState, useEffect } from "react";

export function useSuggestions() {
  const [suggestions, setSuggestions] = useState([
    {
      p: "🤖 AI & Teknologi",
      s: "Apa dampak Gemini AI terhadap dunia kerja di Indonesia?",
    },
    {
      p: "💰 Ekonomi & Investasi",
      s: "Apa itu Danantara dan bagaimana pengaruhnya ke ekonomi?",
    },
    {
      p: "⚽ Timnas Indonesia",
      s: "Seberapa jauh peluang Timnas Indonesia di kualifikasi Piala Dunia?",
    },
    {
      p: "📱 Media Sosial",
      s: "Mengapa konten hiburan dan kuliner paling viral di Indonesia?",
    },
  ]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);

  useEffect(() => {
    async function fetchSuggestions() {
      try {
        const cached = localStorage.getItem("suggestions");
        if (cached) {
          setSuggestions(JSON.parse(cached));
          setLoadingSuggestions(false);
        }
      } catch (_) {}
      
      setLoadingSuggestions(true);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              {
                role: "user",
                content: `Berikan 4 topik pertanyaan yang sedang ramai dibahas di Indonesia sekarang. Format respons HANYA JSON array murni:\n[\n  {"emoji": "emoji relevan", "kategori": "2-3 kata kategori", "pertanyaan": "pertanyaan menarik bahasa Indonesia, max 10 kata"},\n  {"emoji": "...", "kategori": "...", "pertanyaan": "..."},\n  {"emoji": "...", "kategori": "...", "pertanyaan": "..."},\n  {"emoji": "...", "kategori": "...", "pertanyaan": "..."}\n]`,
              },
            ],
          }),
        });

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let full = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          full += decoder.decode(value, { stream: true });
        }
        
        const match = full.match(/\[[\s\S]*\]/);
        if (match) {
          const items = JSON.parse(match[0]);
          const next = items.slice(0, 4).map((item) => ({
            p: `${item.emoji} ${item.kategori}`,
            s: item.pertanyaan,
          }));
          setSuggestions(next);
          try {
            localStorage.setItem("suggestions", JSON.stringify(next));
          } catch (_) {}
        }
      } catch (_) {
      } finally {
        setLoadingSuggestions(false);
      }
    }
    fetchSuggestions();
  }, []);

  return { suggestions, loadingSuggestions };
}
