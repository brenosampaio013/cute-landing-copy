import { useMemo, useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2, Lock, Mail, Phone, User } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { friendlyAuthError } from "@/hooks/use-auth";

export const Route = createFileRoute("/cadastro")({
  head: () => ({
    meta: [
      { title: "Criar conta — Maré Nobre" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Cadastro,
});

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function passwordStrength(pwd: string): { score: 0 | 1 | 2 | 3; label: string; color: string } {
  let s = 0;
  if (pwd.length >= 6) s++;
  if (/[A-Z]/.test(pwd) || /[0-9]/.test(pwd)) s++;
  if (pwd.length >= 10 && /[^A-Za-z0-9]/.test(pwd)) s++;
  const map = [
    { label: "", color: "bg-slate-200" },
    { label: "Fraca", color: "bg-red-400" },
    { label: "Média", color: "bg-amber-400" },
    { label: "Forte", color: "bg-emerald-500" },
  ] as const;
  return { score: s as 0 | 1 | 2 | 3, ...map[s] };
}

function Cadastro() {
  const navigate = useNavigate();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const [accept, setAccept] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const strength = passwordStrength(pwd);

  const errors = {
    name: name && name.trim().length < 3 ? "Informe seu nome completo." : "",
    email: email && !emailRegex.test(email) ? "E-mail inválido." : "",
    phone: phone && phone.replace(/\D/g, "").length < 10 ? "Telefone inválido." : "",
    pwd: pwd && pwd.length < 6 ? "Mínimo de 6 caracteres." : "",
    pwd2: pwd2 && pwd2 !== pwd ? "As senhas não coincidem." : "",
  };

  const canSubmit = useMemo(
    () =>
      name.trim().length >= 3 &&
      emailRegex.test(email) &&
      phone.replace(/\D/g, "").length >= 10 &&
      pwd.length >= 6 &&
      pwd2 === pwd &&
      accept &&
      !loading,
    [name, email, phone, pwd, pwd2, accept, loading]
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!canSubmit) {
      setTouched({ name: true, email: true, phone: true, pwd: true, pwd2: true });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password: pwd,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          nome: name.trim(),
          telefone: phone,
          tipo_usuario: "cliente",

        },
      },
    });
    setLoading(false);
    if (error) {
      setFormError(friendlyAuthError(error.message));
      return;
    }
    navigate({ to: "/dashboard" });
  }





  const inputBase =
    "w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-[#2DD4BF] focus:ring-2 focus:ring-[#2DD4BF]/20";

  return (
    <AuthShell
      quote="Cuide do seu lar em minutos — não em fins de semana."
      imageUrl="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80"
    >
      <h1
        className="text-3xl text-[#0A1A2F] sm:text-4xl"
        style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}
      >
        Crie sua conta
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        Leva menos de um minuto. Depois é só escolher o serviço e o horário.
      </p>


      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Nome completo
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, name: true }))}
              placeholder="Seu nome"
              autoComplete="name"
              className={inputBase}
            />
          </div>
          {touched.name && errors.name && (
            <p className="mt-1 text-xs text-red-500">{errors.name}</p>
          )}
        </div>

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
              className={inputBase}
            />
          </div>
          {touched.email && errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Telefone / WhatsApp
          </label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(maskPhone(e.target.value))}
              onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
              placeholder="(00) 00000-0000"
              autoComplete="tel"
              className={inputBase}
            />
          </div>
          {touched.phone && errors.phone && (
            <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
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
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, pwd: true }))}
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
              className={`${inputBase} pr-10`}
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
          {pwd && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex flex-1 gap-1">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition ${
                      i <= strength.score ? strength.color : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>
              {strength.label && (
                <span className="w-14 text-right text-xs font-medium text-slate-500">
                  {strength.label}
                </span>
              )}
            </div>
          )}
          {touched.pwd && errors.pwd && (
            <p className="mt-1 text-xs text-red-500">{errors.pwd}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Confirmar senha
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type={showPwd2 ? "text" : "password"}
              value={pwd2}
              onChange={(e) => setPwd2(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, pwd2: true }))}
              placeholder="Repita sua senha"
              autoComplete="new-password"
              className={`${inputBase} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPwd2((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-slate-400 hover:text-slate-600"
              aria-label={showPwd2 ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPwd2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {touched.pwd2 && errors.pwd2 && (
            <p className="mt-1 text-xs text-red-500">{errors.pwd2}</p>
          )}
        </div>

        <label className="flex cursor-pointer items-start gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={accept}
            onChange={(e) => setAccept(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#2DD4BF] focus:ring-[#2DD4BF]"
          />
          <span>
            Aceito os{" "}
            <a href="#" className="font-semibold text-[#2DD4BF] hover:underline">
              Termos de Uso
            </a>{" "}
            e{" "}
            <a href="#" className="font-semibold text-[#2DD4BF] hover:underline">
              Política de Privacidade
            </a>
          </span>
        </label>

        {formError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 ring-1 ring-red-100">
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-[#2DD4BF] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Criar conta
        </button>




        <p className="pt-4 text-center text-sm text-slate-500">
          Já tem uma conta?{" "}
          <Link to="/login" className="font-semibold text-[#2DD4BF] hover:underline">
            Entrar
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
