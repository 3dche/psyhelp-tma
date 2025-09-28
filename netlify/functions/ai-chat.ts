import type { Handler } from "@netlify/functions";

export const handler: Handler = async (event) => {
  // Функция принимает только POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;        // ключ берём из Netlify env
    const body = JSON.parse(event.body || "{}");
    const messages = Array.isArray(body.messages) ? body.messages : [];

    if (messages.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: "messages[] required" }) };
    }

    // Если ключа нет — не падаем, просто отвечаем эхом (чтобы фронт «жил»)
    if (!apiKey) {
      const last = messages[messages.length - 1]?.content ?? "";
      return { statusCode: 200, body: JSON.stringify({ text: `Эхо: ${last}` }) };
    }

    // Минимальный запрос к OpenAI (chat.completions)
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Ты бережный психолог-поддержка. Отвечай коротко, эмпатично и без медицинских диагнозов.",
          },
          ...messages,
        ],
        temperature: 0.6,
        max_tokens: 250,
      }),
    });

    const data = await r.json();
    if (!r.ok) {
      return {
        statusCode: r.status,
        body: JSON.stringify({ error: data?.error?.message || "OpenAI error" }),
      };
    }

    const text = data?.choices?.[0]?.message?.content ?? "";
    return { statusCode: 200, body: JSON.stringify({ text }) };
  } catch (e: any) {
    return { statusCode: 500, body: JSON.stringify({ error: e?.message || "Server error" }) };
  }
};
