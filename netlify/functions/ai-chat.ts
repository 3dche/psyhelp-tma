// netlify/functions/ai-chat.ts
import type { Handler } from "@netlify/functions";

/**
 * Мини-чат с ИИ-психологом на OpenAI.
 * Требуется переменная окружения: OPENAI_API_KEY (Netlify → Environment variables).
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Короткая и безопасная роль для ассистента
const SYSTEM_PROMPT = `
Ты — эмпатичный ассистент-психолог. Отвечай по-русски просто и тепло.
Это не медицинская помощь. Не ставь диагнозов и не давай юридических советов.
Используй мягкие вопросы и короткие практики (дыхание 4-7-8, grounding 5-4-3-2-1, дневник благодарности).
Если есть риск для жизни — мягко попроси обратиться в экстренные службы/горячие линии.
Пиши кратко: 3–6 предложений.
`;

// Лёгкая нормализация входящих сообщений
type Msg = { role: "user" | "assistant" | "system"; content: string };

function sanitizeMessages(incoming: any): Msg[] {
  const arr = Array.isArray(incoming) ? incoming : [];
  const safe: Msg[] = [];

  for (const m of arr) {
    const role = (m?.role || "").toString();
    const content = (m?.content || "").toString().slice(0, 2000); // ограничим длину
    if (!content) continue;
    if (role === "user" || role === "assistant") {
      safe.push({ role, content });
    }
  }

  // оставим последние 10 сообщений, чтобы не раздувать контекст
  return safe.slice(-10);
}

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      // так удобнее диагностировать: при GET будет видно 405 (значит функция есть)
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    if (!OPENAI_API_KEY) {
      console.error("Missing OPENAI_API_KEY");
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "NO_API_KEY" }),
      };
    }

    const body = JSON.parse(event.body || "{}");
    const userMessages: Msg[] = sanitizeMessages(body.messages);

    // Запрос в OpenAI (без SDK, через fetch)
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...userMessages,
        ],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      console.error("OpenAI error:", resp.status, errText);
      return {
        statusCode: 502,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "OPENAI_ERROR", status: resp.status }),
      };
    }

    const data = await resp.json();
    const text =
      data?.choices?.[0]?.message?.content ??
      "Извини, сейчас не получилось ответить.";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    };
  } catch (e: any) {
    console.error("ai-chat exception:", e?.message || e);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "SERVER_ERROR" }),
    };
  }
};
