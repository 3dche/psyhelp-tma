import { useEffect, useState } from "react";

// чтобы TS не ругался на window.Telegram
declare global {
  interface Window { Telegram?: any }
}

export default function App() {
  const tg = window.Telegram?.WebApp;
  const [isTg, setIsTg] = useState<boolean>(!!tg);
  const [platform, setPlatform] = useState<string>(tg?.platform ?? "unknown");
  const [version, setVersion] = useState<string>(tg?.version ?? "n/a");

  useEffect(() => {
    if (!tg) return;

    tg.ready();
    tg.MainButton.setParams({ text: "Сказать привет 👋" });
    tg.MainButton.onClick(() => tg.showAlert("Привет из Telegram Mini App!"));
    tg.MainButton.show();

    // показать WebApp в полный рост (часто помогает на десктопе)
    try { tg.expand(); } catch {}

    // обновим статусы
    setIsTg(true);
    setPlatform(tg.platform ?? "unknown");
    setVersion(tg.version ?? "n/a");

    return () => {
      try { tg.MainButton.hide(); } catch {}
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="p-6 rounded-2xl bg-white shadow text-center">
        <h1 className="text-xl font-semibold">PsyHelp Mini</h1>

        <div className="text-sm text-slate-600 mt-2">
          <div>Среда Telegram: <b>{isTg ? "обнаружена ✅" : "не обнаружена ❌"}</b></div>
          <div>Платформа: <b>{platform}</b> · Версия: <b>{version}</b></div>
        </div>

        <div className="mt-4 flex gap-2 justify-center">
          <button
            className="px-3 py-2 rounded-full bg-indigo-600 text-white"
            onClick={() => tg ? tg.MainButton.show() : alert("Telegram WebApp не обнаружен")}
          >
            Показать MainButton
          </button>
          <button
            className="px-3 py-2 rounded-full bg-slate-200"
            onClick={() => tg ? tg.showAlert("Проверка alert") : alert("Проверка alert")}
          >
            Проверить alert
          </button>
        </div>

        {!isTg && (
          <p className="text-xs text-slate-500 mt-3">
            Откройте через <a className="underline" href="https://t.me/psy_help_new_bot/psyhelp">t.me/psy_help_new_bot/psyhelp</a>
          </p>
        )}
      </div>
    </div>
  );
}
