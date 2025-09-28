import type { Handler } from "@netlify/functions";

const BOT_TOKEN = process.env.BOT_TOKEN!;
const TG_API = `https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`;

export const handler: Handler = async (event) => {
  if (!BOT_TOKEN) return { statusCode: 500, body: "Missing BOT_TOKEN env var" };

  const url = new URL(event.rawUrl);
  const stars = Math.max(1, Math.min(100000, Math.floor(Number(url.searchParams.get("a") || "30"))));
  const desc = url.searchParams.get("desc") || "PsyHelp Pro — 1 месяц";

  const body = {
    title: "PsyHelp Pro",
    description: desc,
    payload: "pro_1m",
    currency: "XTR",
    prices: [{ label: "PsyHelp Pro", amount: stars }],
  };

  const r = await fetch(TG_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await r.json();
  if (!data.ok) return { statusCode: 500, body: JSON.stringify(data) };

  return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ link: data.result }) };
};
