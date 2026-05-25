export async function streamChat(messages, onUpdate) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  if (!res.ok) {
    let errMsg = `HTTP ${res.status}`;
    try {
      const e = await res.json();
      errMsg = e.error ?? errMsg;
    } catch (_) {}
    throw new Error(errMsg);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let accumulated = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    accumulated += decoder.decode(value, { stream: true });
    onUpdate(accumulated);
  }
  return accumulated;
}
