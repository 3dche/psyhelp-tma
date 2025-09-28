import { useEffect, useState } from "react";
import Chat from "./components/Chat";
declare global { interface Window { Telegram?: any } }

export default function App() {
  const tg = window.Telegram?.WebApp;
  const [status, setStatus] = useState("");
  const [invoiceLink, setInvoiceLink] = useState<string | null>(null);

  useEffect(() => { if (tg) { tg.ready(); try { tg.expand(); } catch {} } }, []);

  async function buyStars(amount = 30) {
    try {
      setStatus("Создаём счёт…"); setInvoiceLink(null);
      const res = await fetch(`/api/stars-create-link?a=${amount}`);
      const { link } = await res.json();
      setInvoiceLink(link);
      if (tg?.openInvoice) {
        const r = await tg.openInvoice(link);
        setStatus(r?.status === "paid" ? "Оплата прошла ✅" : "Оплата отменена.");
      } else {
        window.location.href = link;
      }
    } catch (e: any) { setStatus("Ошибка оплаты: " + (e?.message || "unknown")); }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-md mx-auto py-6 px-4">
        <div className="bg-white rounded-2xl shadow p-4 mb-4 text-center">
          <h1 className="text-xl font-semibold">PsyHelp Mini</h1>
          <button className="mt-3 px-4 py-2 rounded-full bg-indigo-600 text-white" onClick={() => buyStars(30)}>
            Купить Pro ⭐ 30
          </button>
          {status && <div className="mt-2 text-sm text-slate-600">{status}</div>}
          {invoiceLink && <a className="text-indigo-600 underline text-sm" href={invoiceLink}>Открыть счёт вручную</a>}
        </div>

        <Chat />
      </div>
    </div>
  );
}
