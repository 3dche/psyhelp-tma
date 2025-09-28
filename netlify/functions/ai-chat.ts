import type { Handler } from "@netlify/functions";

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";
const SITE_URL = process.env.SITE_URL ?? process.env.URL ?? "https://psyhelp-tma.netlify.app";
const APP_TITLE = "PsyHelp Mini";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function buildMessages(userMessage: string, history: any[] = []) {
  const system = {
    role: "system",
    content:
      "Ты — эмпатичный ИИ-психолог. Отвечай коротко (2–5 предложений), поддерживай, задавай один мягкий уточняющий вопрос. " +
      "Не ставь диагнозов и не давай медицинских советов. При угрозе жизни советуй немедленно обратиться в экстренные службы.",
  };
  const msgs = [system, ...history, { role: "user", content: userMessage ?? "" }];
  return msgs;
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: corsHeaders(), body: "Method Not Allowed" };
  }

  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    return { statusCode: 500, headers: corsHeaders(), body: "Missing OPENROUTER_API_KEY" };
  }

  try {
    const { message, history } = JSON.parse(event.body ?? "{}");
    const messages = buildMessages(message, history);

    const r = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        // OpenRouter рекомендует эти заголовки:
        "HTTP-Referer": SITE_URL,
        "X-Title": APP_TITLE,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const data = await r.json();
    if (!r.ok) {
      console.error("OpenRouter error", data);
      return { statusCode: r.status, headers: corsHeaders(), body: JSON.stringify({ error: data }) };
    }

    const text = data.choices?.[0]?.message?.content ?? "Извини, сейчас не получилось ответить.";
    return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify({ reply: text }) };
  } catch (e: any) {
    console.error(e);
    return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: e.message ?? "Server error" }) };
  }
};

export default handler;
