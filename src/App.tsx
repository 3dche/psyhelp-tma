import { useEffect, useState } from "react";
declare global { interface Window { Telegram?: any } }

export default function App() {
  const tg = window.Telegram?.WebApp;
  const [status, setStatus] = useState("");

  useEffect(() => { if (tg) { tg.ready(); try { tg.expand(); } catch {} } }, []);

  async function buyStars(amount = 30) {
    try {
      setStatus("Создаём счёт…");
      const res = await fetch(`/api/stars-create-link?a=${amount}`);
      if (!res.ok) throw new Error(await res.text());
      const { link } = await res.json();
      if (tg?.openInvoice) {
        const r = await tg.openInvoice(link);
        setStatus(r?.status === "paid" ? "Оплата прошла ✅" : "Оплата отменена.");
      } else {
        window.location.href = link;
      }
    } catch (e: any) { setStatus("Ошибка оплаты: " + (e?.message || "unknown")); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="p-6 rounded-2xl bg-white shadow text-center max-w-md">
        <h1 className="text-xl font-semibold">PsyHelp Mini</h1>
        <button className="mt-4 px-4 py-2 rounded-full bg-indigo-600 text-white"
                onClick={() => buyStars(30)}>
          Купить Pro ⭐ 30
        </button>
        {status && <div className="mt-2 text-sm text-slate-600">{status}</div>}
      </div>
    </div>
  );
}
