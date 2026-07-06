import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2, Lock, CheckCircle2 } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { supabase } from "@/integrations/supabase/client";
import { friendlyAuthError } from "@/hooks/use-auth";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Redefinir senha — Maré Nobre" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);

  // Ao acessar via link do e-mail, o Supabase entrega uma sessão de recovery.
  useEffect(() => {
    let mounted = true;

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" || session) {
        setReady(true);
        setInvalidLink(false);
      }
    });

    (async () => {
      // Fluxo PKCE: link vem com ?code=... — precisa trocar por sessão.
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (mounted && !error) {
          setReady(true);
          // limpa o code da URL
          url.searchParams.delete("code");
          window.history.replaceState({}, "", url.pathname + url.search + url.hash);
          return;
        }
      }

      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (data.session) {
        setReady(true);
        return;
      }

      const hash = window.location.hash;
      const hasRecoveryHash =
        hash.includes("type=recovery") || hash.includes("access_token");

      // Aguarda um pouco para o onAuthStateChange disparar (PASSWORD_RECOVERY).
      setTimeout(() => {
        if (!mounted) return;
        if (!hasRecoveryHash && !code) {
          setInvalidLink(true);
        }
      }, 1500);
    })();

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const passwordError =
    password && password.length < 6 ? "A senha deve ter no mínimo 6 caracteres." : "";
  const confirmError =
    confirm && confirm !== password ? "As senhas não coincidem." : "";

  const canSubmit = useMemo(
    () => ready && password.length >= 6 && confirm === password && !loading,
    [ready, password, confirm, loading]
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!canSubmit) return;
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setFormError(friendlyAuthError(error.message));
      return;
    }
    setSuccess(true);
    setTimeout(() => navigate({ to: "/login" }), 2500);
  }

  const inputBase =
    "w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-800 outline-none transition focus:border-[#2DD4BF] focus:ring-2 focus:ring-[#2DD4BF]/20";

  return (
    <AuthShell quote="Redefina sua senha com segurança." imageUrl="">
      <h1
        className="text-center text-3xl text-[#0A1A2F] sm:text-4xl"
        style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}
      >
        Nova <span className="text-[#0A9E8A]">senha</span>
      </h1>
      <p className="mt-2 text-center text-sm text-slate-500">
        Escolha uma senha nova para acessar sua conta
      </p>

      {invalidLink ? (
        <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Este link de recuperação é inválido ou expirou.{" "}
          <Link to="/login" className="font-semibold underline">
            Solicitar novo link
          </Link>
        </div>
      ) : success ? (
        <div className="mt-8 flex flex-col items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-center text-sm text-emerald-800">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          <p className="font-semibold">Senha atualizada com sucesso!</p>
          <p>Redirecionando para o login…</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Nova senha
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputBase}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {passwordError && (
              <p className="mt-1 text-xs text-red-600">{passwordError}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Confirmar senha
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type={showPwd ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={inputBase}
                placeholder="Repita a nova senha"
                autoComplete="new-password"
              />
            </div>
            {confirmError && (
              <p className="mt-1 text-xs text-red-600">{confirmError}</p>
            )}
          </div>

          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {formError}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#0A9E8A] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Redefinir senha
          </button>

          <p className="pt-4 text-center text-sm text-slate-500">
            Lembrou sua senha?{" "}
            <Link to="/login" className="font-semibold text-[#0A9E8A] hover:underline">
              Voltar ao login
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}
