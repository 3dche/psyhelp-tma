import { useState } from "react";
type Msg = { role: "user" | "assistant"; content: string };

export default function Chat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!text.trim() || loading) return;
    const next = [...messages, { role: "user", content: text.trim() } as Msg];
    setMessages(next);
    setText("");
    setLoading(true);
    try {
      const r = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await r.json();
      setMessages([...next, { role: "assistant", content: data.text }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "Упс, не получилось. Попробуем ещё раз?" }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-xs text-slate-500 mb-2">
        Это не медицинская помощь. При угрозе жизни — звони в экстренные службы.
      </div>

      <div className="bg-white rounded-xl shadow p-4 h-96 overflow-y-auto">
        {messages.length === 0 && (
          <div className="text-slate-500 text-sm">
            Привет! Коротко напиши, что тревожит. Я предложу мягкие шаги.
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`my-2 ${m.role === "user" ? "text-right" : "text-left"}`}>
            <span className={`inline-block px-3 py-2 rounded-2xl ${m.role === "user" ? "bg-indigo-600 text-white" : "bg-slate-100"}`}>
              {m.content}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          className="flex-1 border rounded-xl px-3 py-2"
          placeholder="Напишите сообщение…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button className="px-4 py-2 rounded-xl bg-indigo-600 text-white disabled:opacity-50" onClick={send} disabled={loading}>
          Отправить
        </button>
      </div>
    </div>
  );
}
