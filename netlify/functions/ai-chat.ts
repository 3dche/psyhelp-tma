import type { Handler } from "@netlify/functions";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

const SYSTEM_PROMPT = `
Ты — эмпатичный ассистент-психолог. Говоришь по-русски просто и тепло.
Это не медицинская помощь. Не ставь диагнозов и не давай юр. советов.
Используй мягкие вопросы и короткие практики (дыхание 4-7-8, grounding 5-4-3-2-1, переоценка мыслей, дневник благодарности).
Если есть риск для жизни — мягко попроси обратиться в экстренные службы/горячие линии.
Отвечай кратко: 3–6 предложений.
`;

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
  if (!OPENAI_API_KEY) return { statusCode: 500, body: "Missing OPENAI_API_KEY" };

  const { messages = [] } = JSON.parse(event.body || "{}");

  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
    }),
  });

  const data = await r.json();
  const text = data?.choices?.[0]?.message?.content ?? "Извини, сейчас не получилось ответить.";

  return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) };
};
