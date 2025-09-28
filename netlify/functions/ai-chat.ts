// netlify/functions/ai-chat.ts
import type { Handler } from "@netlify/functions";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: CORS, body: "Method Not Allowed" };
  }

  try {
    const { message } = JSON.parse(event.body || "{}");
    if (!message) {
      return { statusCode: 400, headers: CORS, body: "No message" };
    }

    const apiKey = process.env.OPENAI_API_KEY || "";
    if (!apiKey) {
      return { statusCode: 500, headers: CORS, body: "Missing OPENAI_API_KEY" };
    }

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",          // GPT-4-класс. Если нет доступа — попробуй "gpt-4.1-mini" или "gpt-4o-mini"
        temperature: 0.7,
        max_tokens: 500,
        messages: [
          {
            role: "system",
            content:
              "Ты эмпатичный психолог-консультант. Отвечай кратко, тепло, по делу, избегай медицинских диагнозов. Предлагай простые практики и мягкие вопросы.",
          },
          { role: "user", content: message },
        ],
      }),
    });

    if (!r.ok) {
      const t = await r.text();
      return {
        statusCode: r.status,
        headers: CORS,
        body: `Upstream error: ${t}`,
      };
    }

    const data = await r.json();
    const reply =
      data?.choices?.[0]?.message?.content ??
      "Извини, сейчас не получилось ответить.";

    return {
      statusCode: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
      body: JSON.stringify({ reply }),
    };
  } catch (e: any) {
    return {
      statusCode: 500,
      headers: CORS,
      body: `Server error: ${e?.message || e}`,
    };
  }
};
