import { useEffect, useState } from "react";
import { X, Share } from "lucide-react";
import logo from "@/assets/logo.png";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "mare-nobre:install-dismissed";

export function InstallAppBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Already installed / running standalone
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS Safari
      window.navigator.standalone === true;
    if (standalone) return;

    if (sessionStorage.getItem(DISMISS_KEY)) return;

    const ua = window.navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
    setIsIOS(ios);
    if (ios) setVisible(true);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    const onInstalled = () => setVisible(false);

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSHelp(true);
      return;
    }
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
  };

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <>
      <div className="fixed inset-x-3 bottom-24 z-40 sm:inset-x-auto sm:left-6 sm:bottom-6 sm:max-w-sm">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0A1A2F] p-4 pr-10 text-white shadow-2xl ring-1 ring-black/20">
          <button
            onClick={handleDismiss}
            aria-label="Fechar"
            className="absolute right-2 top-2 rounded-full p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-start gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/10 ring-1 ring-white/15"
            >
              <img src={logo} alt="Maré Nobre" className="h-9 w-9 object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Tenha a Maré Nobre na tela inicial</p>
              <p className="mt-0.5 text-xs text-white/70">
                Agende serviços em 2 toques, direto do seu celular.
              </p>
              <button
                onClick={handleInstall}
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#2DD4BF] px-4 py-2 text-xs font-semibold text-[#0A1A2F] transition hover:brightness-110"
              >
                {isIOS ? "Como instalar" : "Instalar agora"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showIOSHelp && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
          onClick={() => setShowIOSHelp(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 text-[#0A1A2F] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold">Adicionar à Tela de Início</h3>
            <ol className="mt-4 space-y-3 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2DD4BF]/15 text-xs font-bold text-[#0A9E8A]">
                  1
                </span>
                <span>
                  Toque no ícone <Share className="inline h-4 w-4" /> Compartilhar
                  na barra do Safari.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2DD4BF]/15 text-xs font-bold text-[#0A9E8A]">
                  2
                </span>
                <span>Selecione <strong>"Adicionar à Tela de Início"</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2DD4BF]/15 text-xs font-bold text-[#0A9E8A]">
                  3
                </span>
                <span>Toque em <strong>Adicionar</strong>. Pronto!</span>
              </li>
            </ol>
            <button
              onClick={() => setShowIOSHelp(false)}
              className="mt-6 w-full rounded-full bg-[#0A1A2F] py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
}
