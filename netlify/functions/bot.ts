import type { Handler } from "@netlify/functions";

const TOKEN = process.env.BOT_TOKEN!;
const API = `https://api.telegram.org/bot${TOKEN}`;

async function tg(method: string, body: any) {
  await fetch(`${API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function sendMessage(chat_id: number, text: string, extra: any = {}) {
  return tg("sendMessage", { chat_id, text, parse_mode: "HTML", ...extra });
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 200, body: "OK" };
  if (!TOKEN) return { statusCode: 500, body: "No BOT_TOKEN" };

  const update = JSON.parse(event.body || "{}");

  // Сообщения
  const msg = update.message || update.edited_message;
  if (msg?.chat?.id) {
    const chatId = msg.chat.id;
    const text = (msg.text || "").trim();

    if (text === "/start") {
      await sendMessage(
        chatId,
        "Привет! Это PsyHelp. Открой мини-приложение 👇",
        {
          reply_markup: {
            inline_keyboard: [
              [{ text: "Открыть PsyHelp", web_app: { url: "https://psyhelp-tma.netlify.app" } }],
              [{ text: "Оплатить Pro ⭐", callback_data: "pay" }],
            ],
          },
        }
      );
    } else if (text.startsWith("/pay")) {
      const r = await fetch("https://psyhelp-tma.netlify.app/api/stars-create-link?a=30");
      const data = await r.json().catch(() => ({}));
      await sendMessage(chatId, data?.link ? `Ссылка на оплату: ${data.link}` : "Не смог создать счёт.");
    } else {
      await sendMessage(chatId, "Напиши /start чтобы открыть мини-приложение.");
    }
  }

  // Нажатия на inline-кнопки
  const cq = update.callback_query;
  if (cq?.id && cq.data === "pay") {
    const r = await fetch("https://psyhelp-tma.netlify.app/api/stars-create-link?a=30");
    const data = await r.json().catch(() => ({}));
    // Откроет ссылку прямо из кнопки
    await tg("answerCallbackQuery", { callback_query_id: cq.id, url: data?.link });
  }

  return { statusCode: 200, body: "OK" };
};
