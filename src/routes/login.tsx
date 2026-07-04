import { createFileRoute, Link } from "@tanstack/react-router";
import { SitePage } from "@/components/site-page";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Entrar — Maré Nobre" }, { name: "robots", content: "noindex" }] }),
  component: Login,
});

function Login() {
  return (
    <SitePage title="Entrar" subtitle="Acesse sua conta Maré Nobre.">
      <form className="mx-auto max-w-md space-y-4 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-100">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">E-mail</span>
          <input type="email" className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#2DD4BF] focus:ring-2 focus:ring-[#2DD4BF]/20" />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Senha</span>
          <input type="password" className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#2DD4BF] focus:ring-2 focus:ring-[#2DD4BF]/20" />
        </label>
        <button type="button" className="w-full rounded-lg bg-brand-navy px-4 py-3 text-sm font-semibold text-white hover:brightness-125">Entrar</button>
        <p className="text-center text-sm text-slate-500">
          Não tem conta?{" "}
          <Link to="/cadastro" className="font-semibold text-[#2DD4BF] hover:underline">Cadastre-se</Link>
        </p>
      </form>
    </SitePage>
  );
}
