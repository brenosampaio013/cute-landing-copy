import { useMemo, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { supabase } from "@/integrations/supabase/client";
import { friendlyAuthError } from "@/hooks/use-auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — Maré Nobre" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Login,
});

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [remember, setRemember] = useState(true);
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const emailError = email && !emailRegex.test(email) ? "E-mail inválido." : "";
  const passwordError =
    password && password.length < 6 ? "A senha deve ter no mínimo 6 caracteres." : "";
  const canSubmit = useMemo(
    () => emailRegex.test(email) && password.length >= 6 && !loading,
    [email, password, loading]
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!canSubmit) {
      setTouched({ email: true, password: true });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setFormError(friendlyAuthError(error.message));
      return;
    }
    navigate({ to: "/dashboard" });
  }



  async function onForgot() {
    setFormError(null);
    if (!emailRegex.test(email)) {
      setTouched((t) => ({ ...t, email: true }));
      setFormError("Informe seu e-mail acima para receber o link de recuperação.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      setFormError(friendlyAuthError(error.message));
      return;
    }
    setFormError("Enviamos um link de recuperação para o seu e-mail.");
  }


  return (
    <AuthShell
      quote="Cuidado completo para o seu lar."
      imageUrl=""
    >
      <h1
        className="text-center text-3xl text-[#0A1A2F] sm:text-4xl"
        style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}
      >
        Que bom <span className="text-[#0A9E8A]">te ver por aqui!</span>
      </h1>
      <p className="mt-2 text-center text-sm text-slate-500">
        Acesse sua conta para continuar
      </p>


      <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            E-mail
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              placeholder="voce@exemplo.com"
              autoComplete="email"
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-[#2DD4BF] focus:ring-2 focus:ring-[#2DD4BF]/20"
            />
          </div>
          {touched.email && emailError && (
            <p className="mt-1 text-xs text-red-500">{emailError}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Senha
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type={showPwd ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-800 outline-none transition focus:border-[#2DD4BF] focus:ring-2 focus:ring-[#2DD4BF]/20"
            />
            <button
              type="button"
              onClick={() => setShowPwd((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-slate-400 hover:text-slate-600"
              aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {touched.password && passwordError && (
            <p className="mt-1 text-xs text-red-500">{passwordError}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-[#2DD4BF] focus:ring-[#2DD4BF]"
            />
            Lembrar de mim
          </label>
          <button
            type="button"
            onClick={onForgot}
            className="text-sm font-semibold text-[#2DD4BF] hover:underline"
          >
            Esqueci minha senha
          </button>
        </div>

        {formError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 ring-1 ring-red-100">
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#0A1A2F] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-125 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Entrar
        </button>




        <p className="pt-4 text-center text-sm text-slate-500">
          Não tem uma conta?{" "}
          <Link to="/cadastro" className="font-semibold text-[#0A9E8A] hover:underline">
            Cadastre-se
          </Link>
        </p>

        <p className="flex items-center justify-center gap-1.5 pt-6 text-center text-xs text-slate-400">
          <Lock className="h-3 w-3" />
          Seus dados estão protegidos conosco.
        </p>

      </form>
    </AuthShell>
  );
}
