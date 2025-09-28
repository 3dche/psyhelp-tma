import type { Handler } from "@ai-chat.ts";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

const SYSTEM_PROMPT = `
Ты — эмпатичный ассистент-психолог. Говоришь по-русски просто и тепло.
Это не медицинская помощь. Не ставь диагнозов и не давай юр. советов.
Используй мягкие вопросы и короткие практики (дыхание 4-7-8, grounding 5-4-3-2-1, переоценка мыслей, дневник благодарности).
Если есть риск для жизни — мягко попроси обратиться в экстренные службы/горячие линии.
Отвечай кратко: 3–6 предложений.
`;

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }
    if (!OPENAI_API_KEY) {
      console.error("Missing OPENAI_API_KEY");
      return { statusCode: 500, body: JSON.stringify({ error: "NO_API_KEY" }) };
    }

    const { messages = [] } = JSON.parse(event.body || "{}");

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      }),
    });

    if (!r.ok) {
      const err = await r.text();
      console.error("OpenAI error:", r.status, err);
      return { statusCode: 502, body: JSON.stringify({ error: "OPENAI_ERROR", status: r.status }) };
    }

    const data = await r.json();
    const text = data?.choices?.[0]?.message?.content ?? "Извини, сейчас не получилось ответить.";

    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) };
  } catch (e: any) {
    console.error("ai-chat exception:", e?.message || e);
    return { statusCode: 500, body: JSON.stringify({ error: "SERVER_ERROR" }) };
  }
};
